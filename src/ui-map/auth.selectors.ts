export const authSelectors = {
  loginPage: {
    usernameField: 'input[name="username"]',
    passwordField: 'input[name="password"]',
    submitAction: 'button[type="submit"], input[type="submit"]',
    loginForm: 'form#login, form[action*="/login/index.php"]',
    loggedInSignal: 'pending: dashboard or user-menu marker to be verified after login'
  }
} as const;
