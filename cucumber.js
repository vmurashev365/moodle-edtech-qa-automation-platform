const common = {
  paths: ['features/**/*.feature'],
  requireModule: ['ts-node/register'],
  require: ['src/support/**/*.ts', 'src/steps/**/*.ts'],
  format: ['progress', 'json:reports/cucumber/cucumber-report.json', 'allure-cucumberjs/reporter'],
  formatOptions: {
    resultsDir: 'reports/allure-results',
    snippetInterface: 'async-await'
  },
  retry: 0,
  timeout: 30000
};

const localDemoPaths = [
  'features/smoke/controlled-moodle-login-smoke.feature',
  'features/e2e/teacher-dashboard-assignment-review.feature',
  'features/e2e/teacher-assignment-grading.feature'
];

const demoCommon = {
  ...common,
  paths: localDemoPaths,
  format: ['summary', 'json:reports/cucumber/cucumber-report.json', 'allure-cucumberjs/reporter']
};

module.exports = {
  default: {
    ...common,
    tags: 'not @wip'
  },
  demo: {
    ...demoCommon,
    tags: '@local and not @wip'
  },
  screencast: {
    ...demoCommon,
    tags: '@local and not @wip'
  },
  fast: {
    ...common,
    tags: 'not @local and not @wip'
  },
  smoke: {
    ...common,
    tags: '@smoke and not @wip'
  },
  web: {
    ...common,
    tags: '@web and not @wip'
  },
  e2e: {
    ...common,
    tags: '@e2e and not @wip'
  },
  api: {
    ...common,
    tags: '@api and not @wip'
  },
  security: {
    ...common,
    tags: '@security and not @wip'
  },
  media: {
    ...common,
    tags: '@media and not @wip'
  },
  all: {
    ...common,
    tags: 'not @wip'
  },
  wip: {
    ...common,
    tags: '@wip'
  }
};
