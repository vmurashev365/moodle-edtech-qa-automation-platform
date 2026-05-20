import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { logger } from '../src/utils/logger';

interface CucumberJsonElement {
  type?: string;
  keyword?: string;
}

interface CucumberJsonFeature {
  elements?: CucumberJsonElement[];
}

function parseArgs(argv: string[]): { cucumberArgs: string[]; label: string } {
  const cucumberArgs: string[] = [];
  let label = 'cucumber-selection';

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--name' || arg === '--label') {
      label = argv[index + 1] ?? label;
      index += 1;
      continue;
    }

    cucumberArgs.push(arg);
  }

  return { cucumberArgs, label };
}

function safeFileName(name: string): string {
  return (
    name
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'cucumber-selection'
  );
}

function countSelectedScenarios(reportPath: string): number {
  if (!existsSync(reportPath)) {
    return 0;
  }

  const payload = JSON.parse(readFileSync(reportPath, 'utf8')) as CucumberJsonFeature[];

  if (!Array.isArray(payload)) {
    return 0;
  }

  return payload.reduce((count, feature) => {
    const elements = Array.isArray(feature.elements) ? feature.elements : [];
    return count + elements.filter((element) => element.type === 'scenario' || element.keyword === 'Scenario').length;
  }, 0);
}

function main(): void {
  const { cucumberArgs, label } = parseArgs(process.argv.slice(2));
  const reportDirectory = path.resolve('reports', 'cucumber');
  const guardReportRelativePath = path.posix.join('reports', 'cucumber', `${safeFileName(label)}-guard-report.json`);
  const guardReportPath = path.resolve(guardReportRelativePath);
  const cucumberBin = path.resolve('node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber-js');

  mkdirSync(reportDirectory, { recursive: true });

  const result = spawnSync(
    process.execPath,
    [cucumberBin, ...cucumberArgs, '--format', `json:${guardReportRelativePath}`],
    {
      env: process.env,
      stdio: 'inherit',
      windowsHide: true
    }
  );

  if (result.error) {
    throw result.error;
  }

  const selectedScenarioCount = countSelectedScenarios(guardReportPath);

  if (selectedScenarioCount === 0 && result.status === 0) {
    logger.error(
      `${label} selected 0 executable Cucumber scenarios. Failing intentionally to prevent a false-green command.`
    );
    process.exitCode = 1;
    return;
  }

  logger.info(`${label} selected ${selectedScenarioCount} executable Cucumber scenario(s).`);
  process.exitCode = result.status ?? 1;
}

try {
  main();
} catch (error) {
  logger.error((error as Error).message);
  process.exitCode = 1;
}
