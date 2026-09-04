// Authentication System
class AuthManager {
  constructor() {
    this.currentUser = this.loadUser();
  }

  loadUser() {
    const user = localStorage.getItem("currentUser");
    return user ? JSON.parse(user) : null;
  }

  getAllUsers() {
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

  register(email, password, firstName, lastName) {
    const users = this.getAllUsers();
    
    // Check if email already exists
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
    this.login(email, password);
    return { success: true, user: newUser };
  }

  login(email, password) {
    const users = this.getAllUsers();
    const user = users.find(u => u.email === email && (u.password_hash || u.password) === btoa(password));

    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    const { password: _, password_hash: __, ...userWithoutPassword } = user;
    this.currentUser = userWithoutPassword;
    localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword));
    return { success: true, user: userWithoutPassword };
  }

  logout() {
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
