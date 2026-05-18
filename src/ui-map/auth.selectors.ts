export const authSelectors = {
  loginPage: {
    usernameField: 'input[name="username"]',
    passwordField: 'input[name="password"]',
    submitAction: 'button[type="submit"], input[type="submit"]',
    loginForm: 'form#login, form[action*="/login/index.php"]',
    loginError: '#loginerrormessage, .loginerrors, .alert-danger'
  },
  authenticatedPage: {
    userMenu: '#user-menu-toggle, [data-region="usermenu"], .usermenu',
    dashboardLink: 'a[href*="/my/"]'
  }
} as const;
