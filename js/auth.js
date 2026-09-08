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
        if (!error && data && data.length) return data;
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
        if (error || !data || !data.user) {
          // Fall back to local storage so registration still works offline
          // or when Supabase requires email confirmation / rejects the signup
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
        // Also save locally so login still works even if Supabase later
        // rejects the sign-in (e.g. unconfirmed email)
        const users = await this.getAllUsers();
        if (!users.some(u => u.email === email)) {
          users.push({ id: user.id, email, password_hash: btoa(password), firstName, lastName, role: "user", createdAt: new Date().toISOString() });
          this.saveUsers(users);
        }
        this.currentUser = { id: user.id, email, firstName, lastName, role: "user" };
        localStorage.setItem("currentUser", JSON.stringify(this.currentUser));
        return { success: true, user: this.currentUser };
      } catch (e) {
        return { success: false, error: e.message };
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
    const user = users.find(u => u.email === email && (u.password_hash || u.password) === btoa(password));
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
