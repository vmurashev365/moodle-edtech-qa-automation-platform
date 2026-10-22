// Moodle CSS contracts are fallback-only. Page Objects should prefer
// user-facing Playwright locators (label/role/text) before using these.
export const authLegacySelectors = {
  loginPage: {
    usernameField: 'input[name="username"]',
    passwordField: 'input[name="password"]',
    submitAction: '#loginbtn',
    loginForm: 'form#login, form[action*="/login/index.php"]',
    loginError: '#loginerrormessage, .loginerrors, .alert-danger',
    // core/togglesensitive wraps the password input in this container once it has replaced it.
    passwordToggleWrappedField: '.toggle-sensitive-wrapper #password'
  },
  authenticatedPage: {
    userMenu: '#user-menu-toggle, [data-region="usermenu"], .usermenu',
    dashboardLink: 'a[href*="/my/"]'
  }
} as const;
