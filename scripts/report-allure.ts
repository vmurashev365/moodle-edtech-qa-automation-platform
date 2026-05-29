import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadEnv } from '../src/support/env';
import { resolveRuntimeProfile } from '../src/support/runtime-profile';

const resultsDir = path.resolve('reports', 'allure-results');
const reportDir = path.resolve('reports', 'allure-report');

function sanitizePropertyValue(value: string | number | boolean | undefined): string {
  return String(value ?? '<not set>').replace(/\r?\n/g, ' ');
}

function hasAllureResults(): boolean {
  if (!existsSync(resultsDir)) {
    return false;
  }

  return readdirSync(resultsDir).some((file) => file.endsWith('-result.json') || file.endsWith('-container.json'));
}

function githubRunUrl(): string | undefined {
  const serverUrl = process.env.GITHUB_SERVER_URL;
  const repository = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;

  if (!serverUrl || !repository || !runId) {
    return undefined;
  }

  return `${serverUrl}/${repository}/actions/runs/${runId}`;
}

function writeEnvironmentProperties(): void {
  const env = loadEnv();
  const runtimeProfile = resolveRuntimeProfile();
  const lines = [
    ['Framework', 'Moodle EdTech QA Automation Platform'],
    ['Runner', 'Cucumber + Playwright'],
    ['ExecutionProfile', runtimeProfile.name],
    ['Headless', runtimeProfile.headless],
    ['Screencast', runtimeProfile.screencastEnabled],
    ['TraceMode', runtimeProfile.traceMode],
    ['VideoMode', runtimeProfile.videoMode],
    ['BaseURL', env.baseUrl],
    ['Course', env.courseName],
    ['Assignment', env.assignmentName],
    ['Student', env.studentDisplayName || env.studentUsername],
    ['StudentEmail', env.studentEmail],
    ['TargetGrade', env.targetGrade],
    ['NodeVersion', process.version],
    ['GeneratedAt', new Date().toISOString()]
  ];

  writeFileSync(
    path.join(resultsDir, 'environment.properties'),
    lines.map(([key, value]) => `${key}=${sanitizePropertyValue(value)}`).join('\n') + '\n'
  );
}

function writeExecutor(): void {
  const runUrl = githubRunUrl();
  const payload = {
    name: 'Moodle EdTech QA Automation Platform',
    type: 'edtech',
    buildName: process.env.ALLURE_RUN_LABEL || process.env.GITHUB_WORKFLOW || 'Local Moodle QA run',
    buildUrl: runUrl,
    reportName: process.env.ALLURE_REPORT_NAME || 'Moodle EdTech QA Automation Report',
    reportUrl: runUrl
  };

  writeFileSync(path.join(resultsDir, 'executor.json'), JSON.stringify(payload, null, 2));
}

function writeCategories(): void {
  const categories = [
    {
      name: 'Moodle navigation or availability',
      messageRegex: '.*(Moodle is not reachable|ERR_CONNECTION|navigation|goto|URL|timeout.*navigation).*',
      matchedStatuses: ['failed', 'broken']
    },
    {
      name: 'Selector or visibility',
      messageRegex: '.*(locator|visible|waiting for|strict mode violation|toBeVisible|toContainText).*',
      matchedStatuses: ['failed', 'broken']
    },
    {
      name: 'Grading or gradebook assertion',
      messageRegex: '.*(grade|gradebook|Student QA|target grade|Expected not-graded status).*',
      matchedStatuses: ['failed']
    },
    {
      name: 'Environment or seed readiness',
      messageRegex: '.*(MOODLE_|controlled Moodle|seed|readiness|configuration).*',
      matchedStatuses: ['failed', 'broken']
    },
    {
      name: 'Timeout',
      messageRegex: '.*(Timeout|timeout|timed out|exceeded).*',
      matchedStatuses: ['failed', 'broken']
    }
  ];

  writeFileSync(path.join(resultsDir, 'categories.json'), JSON.stringify(categories, null, 2));
}

function writeJsonIfMissing(filePath: string, payload: unknown): void {
  if (!existsSync(filePath)) {
    writeFileSync(filePath, JSON.stringify(payload, null, 2));
  }
}

function writeMissingReportData(): void {
  const widgetsDir = path.join(reportDir, 'widgets');
  const dataDir = path.join(reportDir, 'data');

  mkdirSync(widgetsDir, { recursive: true });
  mkdirSync(dataDir, { recursive: true });

  writeJsonIfMissing(path.join(widgetsDir, 'behaviors.json'), { total: 0, items: [] });
  writeJsonIfMissing(path.join(dataDir, 'behaviors.json'), { uid: 'behaviors-empty', name: 'behaviors', children: [] });
  writeJsonIfMissing(path.join(dataDir, 'packages.json'), { uid: 'packages-empty', name: 'packages', children: [] });
}

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function injectReportBranding(): void {
  const assetsDir = path.join(reportDir, 'assets');
  const indexPath = path.join(reportDir, 'index.html');
  const stylesheetName = 'moodle-allure-branding.css';
  const stylesheetPath = path.join(assetsDir, stylesheetName);
  const bookIcon = svgDataUrl(
    [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
      '<rect width="64" height="64" rx="14" fill="#eaf4ff"/>',
      '<path d="M14 14h15c4 0 7 3 7 7v29c0-4-3-7-7-7H14z" fill="#2f80ed"/>',
      '<path d="M50 14H35c-4 0-7 3-7 7v29c0-4 3-7 7-7h15z" fill="#56cc9d"/>',
      '<path d="M32 20v30" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>',
      '<path d="M18 24h10M18 32h10M46 24H36M46 32H36" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>',
      '</svg>'
    ].join('')
  );

  writeFileSync(
    stylesheetPath,
    [
      '.executor-icon__edtech,',
      '.executor-icon__local {',
      `  background-image: url("${bookIcon}") !important;`,
      '  background-size: contain;',
      '}',
      ''
    ].join('\n')
  );

  const indexHtml = readFileSync(indexPath, 'utf8');

  if (!indexHtml.includes(stylesheetName)) {
    writeFileSync(
      indexPath,
      indexHtml.replace('</head>', `    <link rel="stylesheet" href="assets/${stylesheetName}">\n  </head>`)
    );
  }
}

function main(): void {
  if (!hasAllureResults()) {
    console.error('[report:allure] no Allure result files found under reports/allure-results');
    process.exit(1);
  }

  mkdirSync(resultsDir, { recursive: true });
  writeEnvironmentProperties();
  writeExecutor();
  writeCategories();

  const allureBin = path.resolve('node_modules', 'allure-commandline', 'bin', 'allure');
  const result = spawnSync(process.execPath, [allureBin, 'generate', resultsDir, '--clean', '-o', reportDir], {
    stdio: 'inherit',
    env: { ...process.env, DEBUG: '' }
  });

  if (result.error) {
    console.error(`[report:allure] failed to execute Allure: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status === 0) {
    writeMissingReportData();
    injectReportBranding();
  }

  process.exitCode = result.status ?? 1;
}

main();
