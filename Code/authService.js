const DEMO_ACCOUNT = {
  email: "TestUser1@gmail.com",
  password: "Password"
};

export const authService = {
  apiBaseUrl: null,

  async login(email, password) {
    // Replace this branch with a POST to `${this.apiBaseUrl}/auth/login`
    // when the application is connected to an Azure-hosted backend.
    if (email === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password) {
      sessionStorage.setItem("promptDatabaseUser", email);
      return { email };
    }

    throw new Error("Invalid email or password.");
  },

  logout() {
    sessionStorage.removeItem("promptDatabaseUser");
  },

  isAuthenticated() {
    return sessionStorage.getItem("promptDatabaseUser") !== null;
  },

  getCurrentUser() {
    return sessionStorage.getItem("promptDatabaseUser");
  }
};