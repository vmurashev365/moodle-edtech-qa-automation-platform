import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Shared by the manual workflow's suite runner, the Allure report and the release packager, so the
// iteration results they show come from one place.

export interface MoodleSuite {
  npmScript: string;
  usesLocalStack: boolean;
  screencast: boolean;
}

// Every command runs through the scenario guard. Local suites use the non-seeding test:local:* scripts
// because the runner seeds once, before iteration 1, and later iterations reuse the same stack.
export const moodleSuites: Record<string, MoodleSuite> = {
  'fast-api': { npmScript: 'test:fast:api', usesLocalStack: false, screencast: false },
  'local-smoke': { npmScript: 'test:local:smoke', usesLocalStack: true, screencast: false },
  'local-teacher-workflow': { npmScript: 'test:local:teacher-workflow', usesLocalStack: true, screencast: false },
  'local-grading': { npmScript: 'test:local:grading', usesLocalStack: true, screencast: false },
  'local-security': { npmScript: 'test:local:security', usesLocalStack: true, screencast: false },
  'local-all': { npmScript: 'test:local:all', usesLocalStack: true, screencast: false },
  'local-demo-screencast-all': { npmScript: 'test:local:screencast:all', usesLocalStack: true, screencast: true }
};

export const maxIterations = 5;

export const evidencePaths = {
  allureResults: path.resolve('reports', 'allure-results'),
  allureReport: path.resolve('reports', 'allure-report'),
  cucumberReport: path.resolve('reports', 'cucumber', 'cucumber-report.json'),
  iterationsDir: path.resolve('reports', 'iterations'),
  runSummary: path.resolve('reports', 'iterations', 'summary.json'),
  environmentFacts: path.resolve('reports', 'environment-facts.json'),
  releaseAssets: path.resolve('reports', 'release-assets')
};

export function iterationDir(iteration: number): string {
  return path.join(evidencePaths.iterationsDir, `iteration-${iteration}`);
}

export interface StatusCounts {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  other: number;
}

export interface IterationResult {
  iteration: number;
  seeded: boolean;
  exitCode: number | null;
  scenarios: StatusCounts;
  steps: StatusCounts;
  passed: boolean;
  problems: string[];
}

export interface RunSummary {
  suite: string;
  iterationsRequested: number;
  iterations: IterationResult[];
  passed: boolean;
}

interface CucumberStep {
  hidden?: boolean;
  result?: { status?: string };
}

interface CucumberElement {
  type?: string;
  steps?: CucumberStep[];
}

interface CucumberFeature {
  elements?: CucumberElement[];
}

export function emptyCounts(): StatusCounts {
  return { total: 0, passed: 0, failed: 0, skipped: 0, other: 0 };
}

function countStatus(counts: StatusCounts, status: string): void {
  counts.total += 1;

  if (status === 'passed' || status === 'failed' || status === 'skipped') {
    counts[status] += 1;
  } else {
    counts.other += 1;
  }
}

// A scenario passes only when every step and hook passed. Hooks are hidden steps in Cucumber JSON, so
// a failing Before hook fails the scenario even though no visible step failed.
function scenarioStatus(steps: CucumberStep[]): string {
  const statuses = steps.map((step) => step.result?.status ?? 'unknown');

  if (statuses.length === 0) {
    return 'unknown';
  }

  if (statuses.includes('failed')) {
    return 'failed';
  }

  if (statuses.every((status) => status === 'passed')) {
    return 'passed';
  }

  return statuses.every((status) => status === 'passed' || status === 'skipped') ? 'skipped' : 'other';
}

export function countCucumberResults(reportPath: string): { scenarios: StatusCounts; steps: StatusCounts } {
  const features = JSON.parse(readFileSync(reportPath, 'utf8')) as CucumberFeature[];
  const scenarios = emptyCounts();
  const steps = emptyCounts();

  for (const feature of features) {
    for (const element of feature.elements ?? []) {
      if (element.type !== 'scenario') {
        continue;
      }

      const elementSteps = element.steps ?? [];
      countStatus(scenarios, scenarioStatus(elementSteps));

      for (const step of elementSteps.filter((candidate) => !candidate.hidden)) {
        countStatus(steps, step.result?.status ?? 'unknown');
      }
    }
  }

  return { scenarios, steps };
}

interface AllureLabel {
  name: string;
  value: string;
}

interface AllureResult {
  historyId?: string;
  labels?: AllureLabel[];
  parameters?: { name: string; value: string }[];
}

// Allure folds results with the same historyId into retries and shows only the last one. Giving each
// iteration its own historyId, an "Iteration N" parent suite and an Iteration parameter keeps every
// iteration visible as its own result.
export function tagAllureResultsWithIteration(resultsDir: string, iteration: number): number {
  let tagged = 0;

  for (const file of readdirSync(resultsDir).filter((name) => name.endsWith('-result.json'))) {
    const filePath = path.join(resultsDir, file);
    const result = JSON.parse(readFileSync(filePath, 'utf8')) as AllureResult;
    const labels = (result.labels ?? []).filter((label) => !['parentSuite', 'suite'].includes(label.name));
    const feature = labels.find((label) => label.name === 'feature')?.value;

    labels.push({ name: 'parentSuite', value: `Iteration ${iteration}` });

    if (feature) {
      labels.push({ name: 'suite', value: feature });
    }

    result.labels = labels;
    result.parameters = [
      ...(result.parameters ?? []).filter((parameter) => parameter.name !== 'Iteration'),
      { name: 'Iteration', value: String(iteration) }
    ];
    result.historyId = `${result.historyId ?? file}:iteration-${iteration}`;
    writeFileSync(filePath, JSON.stringify(result));
    tagged += 1;
  }

  return tagged;
}

export function readRunSummary(): RunSummary | undefined {
  if (!existsSync(evidencePaths.runSummary)) {
    return undefined;
  }

  return JSON.parse(readFileSync(evidencePaths.runSummary, 'utf8')) as RunSummary;
}

export function formatCounts(counts: StatusCounts): string {
  const extra = [counts.skipped ? `${counts.skipped} skipped` : '', counts.other ? `${counts.other} other` : '']
    .filter(Boolean)
    .join(', ');

  return `${counts.passed} passed, ${counts.failed} failed of ${counts.total}${extra ? ` (${extra})` : ''}`;
}

export function iterationLine(result: IterationResult): string {
  const verdict = result.passed ? 'PASSED' : 'FAILED';
  const problems = result.problems.length > 0 ? `; ${result.problems.join('; ')}` : '';

  return `Iteration ${result.iteration}: ${verdict}; scenarios ${formatCounts(result.scenarios)}; steps ${formatCounts(result.steps)}${problems}`;
}
