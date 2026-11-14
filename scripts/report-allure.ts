import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadEnv } from '../src/support/env';
import { resolveRuntimeProfile, type RuntimeProfile } from '../src/support/runtime-profile';
import { githubRunUrl, readEnvironmentFacts } from './lib/environment-facts';
import { formatCounts, readRunSummary } from './lib/evidence-run';

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

function readRuntimeProfileSnapshot(): RuntimeProfile {
  const fallback = resolveRuntimeProfile();
  const snapshotPath = path.join(resultsDir, 'runtime-profile.json');

  if (!existsSync(snapshotPath)) {
    return fallback;
  }

  try {
    const payload = JSON.parse(readFileSync(snapshotPath, 'utf8')) as Partial<RuntimeProfile>;

    return {
      ...fallback,
      name: payload.name === 'demo' || payload.name === 'fast' ? payload.name : fallback.name,
      headless: typeof payload.headless === 'boolean' ? payload.headless : fallback.headless,
      slowMoMs: typeof payload.slowMoMs === 'number' ? payload.slowMoMs : fallback.slowMoMs,
      stepDelayMs: typeof payload.stepDelayMs === 'number' ? payload.stepDelayMs : fallback.stepDelayMs,
      screencastEnabled:
        typeof payload.screencastEnabled === 'boolean' ? payload.screencastEnabled : fallback.screencastEnabled,
      traceMode:
        payload.traceMode === 'off' || payload.traceMode === 'retain-on-failure' || payload.traceMode === 'on'
          ? payload.traceMode
          : fallback.traceMode,
      videoMode:
        payload.videoMode === 'off' || payload.videoMode === 'retain-on-failure' || payload.videoMode === 'on'
          ? payload.videoMode
          : fallback.videoMode,
      terminalStepsEnabled:
        typeof payload.terminalStepsEnabled === 'boolean' ? payload.terminalStepsEnabled : fallback.terminalStepsEnabled
    };
  } catch {
    return fallback;
  }
}

// Present only after scripts/run-moodle-suite.ts, which reads them from the running stack. Plain local
// report runs leave these keys out instead of showing placeholders.
function runFactLines(): [string, string][] {
  const facts = readEnvironmentFacts();
  const summary = readRunSummary();
  const lines: [string, string | undefined][] = [
    ['Suite', summary?.suite ?? facts?.suite],
    ['MoodleRelease', facts?.moodle?.release],
    ['MoodleVersion', facts?.moodle?.version],
    ['MoodleImage', facts?.moodleImage?.reference],
    ['MoodleImageDigest', facts?.moodleImage?.digest],
    ['CommitSha', facts?.commitSha],
    ['RunUrl', facts?.runUrl],
    ['Iterations', summary ? String(summary.iterationsRequested) : undefined],
    ...(summary?.iterations ?? []).map((result): [string, string] => [
      `Iteration${result.iteration}`,
      `${result.passed ? 'passed' : 'failed'}; scenarios ${formatCounts(result.scenarios)}; steps ${formatCounts(result.steps)}`
    ])
  ];

  return lines.filter((line): line is [string, string] => line[1] !== undefined);
}

function writeEnvironmentProperties(): void {
  const env = loadEnv();
  const runtimeProfile = readRuntimeProfileSnapshot();
  const lines = [
    ['Framework', 'Moodle EdTech QA Automation Platform'],
    ['Runner', 'Cucumber + Playwright'],
    ['ExecutionProfile', runtimeProfile.name],
    ['Headless', runtimeProfile.headless],
    ['Screencast', runtimeProfile.screencastEnabled],
    ['SlowMoMs', runtimeProfile.slowMoMs],
    ['StepDelayMs', runtimeProfile.stepDelayMs],
    ['TraceMode', runtimeProfile.traceMode],
    ['VideoMode', runtimeProfile.videoMode],
    ['BaseURL', env.baseUrl],
    ['Course', env.courseName],
    ['Assignment', env.assignmentName],
    ['Student', env.studentDisplayName || env.studentUsername],
    ['StudentEmail', env.studentEmail],
    ['TargetGrade', env.targetGrade],
    ['NodeVersion', process.version],
    ['GeneratedAt', new Date().toISOString()],
    ...runFactLines()
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

// Allure leaves these out when no result carries behavior or package labels, and its UI then shows
// load errors on the Behaviors and Packages pages.
const missingReportData: [string, unknown][] = [
  ['widgets/behaviors.json', { total: 0, items: [] }],
  ['data/behaviors.json', { uid: 'behaviors-empty', name: 'behaviors', children: [] }],
  ['data/packages.json', { uid: 'packages-empty', name: 'packages', children: [] }]
];

function writeMissingReportData(): void {
  for (const [name, payload] of missingReportData) {
    mkdirSync(path.dirname(path.join(reportDir, name)), { recursive: true });
    writeJsonIfMissing(path.join(reportDir, name), payload);
  }
}

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function brandingCss(): string {
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

  return [
    '.executor-icon__edtech,',
    '.executor-icon__local {',
    `  background-image: url("${bookIcon}") !important;`,
    '  background-size: contain;',
    '}',
    ''
  ].join('\n');
}

function injectReportBranding(): void {
  const indexPath = path.join(reportDir, 'index.html');
  const stylesheetName = 'moodle-allure-branding.css';

  writeFileSync(path.join(reportDir, 'assets', stylesheetName), brandingCss());

  const indexHtml = readFileSync(indexPath, 'utf8');

  if (!indexHtml.includes(stylesheetName)) {
    writeFileSync(
      indexPath,
      indexHtml.replace('</head>', `    <link rel="stylesheet" href="assets/${stylesheetName}">\n  </head>`)
    );
  }
}

// A single-file report must open offline over file://, so the branding stylesheet and the missing
// report data go into index.html itself. The data uses the report's own embedding (d(name, base64)).
function inlineSingleFileExtras(): void {
  const indexPath = path.join(reportDir, 'index.html');
  const dataListStart = 'Promise.allSettled([';
  let indexHtml = readFileSync(indexPath, 'utf8');

  if (!indexHtml.includes('</head>') || !indexHtml.includes(dataListStart)) {
    throw new Error('The single-file report has an unexpected layout; branding and report data were not inlined.');
  }

  const embeddedData = missingReportData
    .filter(([name]) => !indexHtml.includes(`d('${name}'`))
    .map(([name, payload]) => `d('${name}','${Buffer.from(JSON.stringify(payload)).toString('base64')}'),`)
    .join('\n        ');

  // Function replacements, so "$" sequences in the inserted text are never read as patterns.
  indexHtml = indexHtml
    .replace('</head>', () => `    <style id="moodle-allure-branding">\n${brandingCss()}    </style>\n  </head>`)
    .replace(dataListStart, () => `${dataListStart}\n        ${embeddedData}`);
  writeFileSync(indexPath, indexHtml);
}

function main(): void {
  const singleFile = process.argv.slice(2).includes('--single-file');

  if (!hasAllureResults()) {
    console.error('[report:allure] no Allure result files found under reports/allure-results');
    process.exit(1);
  }

  mkdirSync(resultsDir, { recursive: true });
  writeEnvironmentProperties();
  writeExecutor();
  writeCategories();

  const allureBin = path.resolve('node_modules', 'allure-commandline', 'bin', 'allure');
  const generateArgs = ['generate', resultsDir, '--clean', '-o', reportDir, ...(singleFile ? ['--single-file'] : [])];
  const result = spawnSync(process.execPath, [allureBin, ...generateArgs], {
    stdio: 'inherit',
    env: { ...process.env, DEBUG: '' }
  });

  if (result.error) {
    console.error(`[report:allure] failed to execute Allure: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status === 0 && singleFile) {
    inlineSingleFileExtras();
  } else if (result.status === 0) {
    writeMissingReportData();
    injectReportBranding();
  }

  process.exitCode = result.status ?? 1;
}

main();
