class AuthManager {
  constructor() {
    this.currentUser = this.loadUser();
  }

  loadUser() {
    const user = localStorage.getItem("currentUser");
    return user ? JSON.parse(user) : null;
  }

  async syncUserToSupabase(user) {
    if (!isSupabaseConfigured) return;
    try {
      await supabaseClient.from("users").upsert({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role || "user",
        createdAt: user.createdAt || user.created_at || new Date().toISOString()
      });
    } catch (e) {
      console.warn("Supabase user sync failed:", e.message);
    }
  }

  async getAllUsers() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseClient.from("users").select("*");
        if (!error && data && data.length) {
          // Merge remote users into local storage so login works
          // even if Supabase later rejects the sign-in (e.g. unconfirmed email)
          const localUsers = database.read("users");
          const merged = [...localUsers];
          for (const remoteUser of data) {
            const localMatch = merged.find(u => u.email === remoteUser.email);
            if (localMatch) {
              // The remote copy is synced without a password hash — keep the
              // local one so the account stays loginable.
              if (!localMatch.password_hash && remoteUser.password_hash) {
                localMatch.password_hash = remoteUser.password_hash;
              }
              continue;
            }
            merged.push({
              id: remoteUser.id,
              email: remoteUser.email,
              firstName: remoteUser.firstName || "",
              lastName: remoteUser.lastName || "",
              role: remoteUser.role || "user",
              password_hash: remoteUser.password_hash || "",
              createdAt: remoteUser.createdAt || remoteUser.created_at || new Date().toISOString()
            });
          }
          if (merged.length > localUsers.length) {
            database.write("users", merged);
          }
          return merged;
        }
      } catch (e) {
        console.warn("Supabase fetch users failed:", e.message);
      }
    }
    const users = database.read("users");
    if (users.length) return users;
    const legacyUsers = JSON.parse(localStorage.getItem("users") || "[]");
    if (legacyUsers.length) {
      const migrated = legacyUsers.map(user => ({
        ...user,
        password_hash: user.password_hash || user.password,
        role: user.role || "user",
        created_at: user.created_at || user.createdAt || new Date().toISOString()
      }));
      database.write("users", migrated);
      return migrated;
    }
    return [];
  }

  saveUsers(users) {
    database.write("users", users);
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  async register(email, password, firstName, lastName) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: { data: { firstName, lastName } }
        });
        // Always save to local storage so login works even if Supabase
        // requires email confirmation or rejects the sign-in later.
        const users = await this.getAllUsers();
        if (!users.some(u => u.email === email)) {
          users.push({ id: database.nextId(users), email, password_hash: btoa(password), firstName, lastName, role: "user", createdAt: new Date().toISOString() });
          this.saveUsers(users);
        }
        if (error || !data || !data.user) {
          return this.registerLocal(email, password, firstName, lastName);
        }
        const user = data.user;
        const profile = {
          id: user.id,
          email: user.email,
          firstName,
          lastName,
          role: "user",
          createdAt: new Date().toISOString()
        };
        await this.syncUserToSupabase(profile);
        this.currentUser = { id: user.id, email, firstName, lastName, role: "user" };
        localStorage.setItem("currentUser", JSON.stringify(this.currentUser));
        return { success: true, user: this.currentUser };
      } catch (e) {
        console.warn("Supabase register failed, using local:", e.message);
        return this.registerLocal(email, password, firstName, lastName);
      }
    }

    return this.registerLocal(email, password, firstName, lastName);
  }

  async registerLocal(email, password, firstName, lastName) {
    const users = await this.getAllUsers();
    if (users.some(u => u.email === email)) {
      return { success: false, error: "Email already registered" };
    }
    const newUser = {
      id: database.nextId(users),
      email,
      password_hash: btoa(password),
      firstName,
      lastName,
      role: "user",
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    this.saveUsers(users);
    await this.loginLocal(email, password);
    return { success: true, user: newUser };
  }

  async login(email, password) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error || !data || !data.user) {
          // Fall back to local accounts (e.g. demo users) when Supabase rejects the login
          return this.loginLocal(email, password);
        }
        const user = data.user;
        let profile = { id: user.id, email: user.email, firstName: "", lastName: "", role: "user" };
        const { data: profileData } = await supabaseClient.from("users").select("*").eq("id", user.id).single();
        if (profileData) {
          profile = { ...profileData };
        }
        this.currentUser = { id: user.id, email: user.email, firstName: profile.firstName || "", lastName: profile.lastName || "", role: profile.role || "user", createdAt: profile.createdAt || profile.created_at || new Date().toISOString() };
        localStorage.setItem("currentUser", JSON.stringify(this.currentUser));
        return { success: true, user: this.currentUser };
      } catch (e) {
        console.warn("Supabase login failed, falling back to local:", e.message);
        return this.loginLocal(email, password);
      }
    }
    return this.loginLocal(email, password);
  }

  async loginLocal(email, password) {
    const users = await this.getAllUsers();
    const encoded = btoa(password);
    let user = users.find(u => u.email === email && (u.password_hash || u.password) === encoded);
    if (!user) {
      // Fallback: the merged list may be missing the password (remote copies
      // are synced without one). Check the untouched local records instead.
      const localOnly = database.read("users")
        .concat(JSON.parse(localStorage.getItem("users") || "[]"))
        .find(u => u.email === email && (u.password_hash || u.password) === encoded);
      if (localOnly) {
        // Restore the password into the stored list so future logins are direct.
        const stored = users.find(u => u.email === email);
        if (stored) {
          stored.password_hash = localOnly.password_hash || localOnly.password;
          this.saveUsers(users);
        }
        user = { ...stored || {}, ...localOnly };
      }
    }
    if (!user) return { success: false, error: "Invalid email or password" };
    const { password: _, password_hash: __, ...userWithoutPassword } = user;
    this.currentUser = userWithoutPassword;
    localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword));
    return { success: true, user: userWithoutPassword };
  }

  async logout() {
    if (isSupabaseConfigured) {
      try { await supabaseClient.auth.signOut(); } catch (e) { }
    }
    this.currentUser = null;
    localStorage.removeItem("currentUser");
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAdmin() {
    return this.isLoggedIn() && this.currentUser.role === "admin";
  }

}

const authManager = new AuthManager();
