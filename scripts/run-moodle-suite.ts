import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import path from 'node:path';

import { logger } from '../src/utils/logger';
import { collectEnvironmentFacts } from './lib/environment-facts';
import {
  countCucumberResults,
  emptyCounts,
  evidencePaths,
  iterationDir,
  iterationLine,
  maxIterations,
  moodleSuites,
  tagAllureResultsWithIteration,
  type IterationResult,
  type MoodleSuite,
  type RunSummary
} from './lib/evidence-run';

// What the Manual Moodle Test Run workflow runs: one suite, N times on the same stack. Iteration 1
// seeds; later iterations rely on the @ungraded-baseline hooks. Every iteration keeps its own Cucumber
// JSON and Allure results, and any failing iteration fails the command.

function usage(): string {
  return `Usage: ts-node scripts/run-moodle-suite.ts --suite <${Object.keys(moodleSuites).join('|')}> --iterations <1-${maxIterations}>`;
}

function parseArgs(argv: string[]): { suiteName: string; suite: MoodleSuite; iterations: number } {
  let suiteName: string | undefined;
  let rawIterations = '1';

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--suite') {
      suiteName = argv[index + 1];
      index += 1;
    } else if (argv[index] === '--iterations') {
      rawIterations = argv[index + 1] ?? '';
      index += 1;
    } else {
      throw new Error(`Unknown argument "${argv[index]}". ${usage()}`);
    }
  }

  const suite = suiteName ? moodleSuites[suiteName] : undefined;

  if (!suiteName || !suite) {
    throw new Error(`Unknown or missing suite "${suiteName ?? ''}". ${usage()}`);
  }

  const iterations = /^\d+$/.test(rawIterations) ? Number(rawIterations) : Number.NaN;

  if (!Number.isInteger(iterations) || iterations < 1 || iterations > maxIterations) {
    throw new Error(`--iterations must be an integer from 1 to ${maxIterations}; received "${rawIterations}".`);
  }

  return { suiteName, suite, iterations };
}

function runNpm(args: string[]): number {
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env
  });

  if (result.error) {
    logger.error(result.error.message);
    return 1;
  }

  return result.status ?? 1;
}

function removeIfPresent(target: string): void {
  rmSync(target, { recursive: true, force: true });
}

function runIteration(iteration: number, suite: MoodleSuite): IterationResult {
  removeIfPresent(evidencePaths.allureResults);
  removeIfPresent(evidencePaths.cucumberReport);

  const seeded = iteration === 1 && suite.usesLocalStack;

  if (seeded) {
    logger.info('Iteration 1: seeding the controlled Moodle stack with deterministic data.');
    const seedStatus = runNpm(['run', 'moodle:seed:ready']);

    if (seedStatus !== 0) {
      return {
        iteration,
        seeded,
        exitCode: seedStatus,
        scenarios: emptyCounts(),
        steps: emptyCounts(),
        passed: false,
        problems: [`seed failed with exit code ${seedStatus}`]
      };
    }
  }

  logger.info(`Iteration ${iteration}: npm run ${suite.npmScript}`);
  const exitCode = runNpm(['run', suite.npmScript]);
  const outputDir = iterationDir(iteration);
  const problems: string[] = [];
  let counts = { scenarios: emptyCounts(), steps: emptyCounts() };

  mkdirSync(outputDir, { recursive: true });

  if (existsSync(evidencePaths.cucumberReport)) {
    copyFileSync(evidencePaths.cucumberReport, path.join(outputDir, 'cucumber-report.json'));
    counts = countCucumberResults(evidencePaths.cucumberReport);
  } else {
    problems.push('no Cucumber JSON report was written');
  }

  if (existsSync(evidencePaths.allureResults)) {
    tagAllureResultsWithIteration(evidencePaths.allureResults, iteration);
    renameSync(evidencePaths.allureResults, path.join(outputDir, 'allure-results'));
  } else {
    problems.push('no Allure results were written');
  }

  if (exitCode !== 0) {
    problems.push(`suite command exited with code ${exitCode}`);
  }

  if (counts.scenarios.total === 0) {
    problems.push('no scenarios ran');
  } else if (counts.scenarios.passed !== counts.scenarios.total) {
    problems.push(
      `${counts.scenarios.total - counts.scenarios.passed} of ${counts.scenarios.total} scenarios did not pass`
    );
  }

  return { iteration, seeded, exitCode, ...counts, passed: problems.length === 0, problems };
}

function mergeAllureResults(results: IterationResult[]): void {
  mkdirSync(evidencePaths.allureResults, { recursive: true });

  for (const result of results) {
    const source = path.join(iterationDir(result.iteration), 'allure-results');

    if (existsSync(source)) {
      cpSync(source, evidencePaths.allureResults, { recursive: true });
    }
  }
}

function writeStepSummary(summary: RunSummary, factsError?: string): void {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;

  if (!summaryFile) {
    return;
  }

  const rows = summary.iterations.map(
    (result) =>
      `| ${result.iteration} | ${result.passed ? 'passed' : 'failed'} | ${result.scenarios.passed} | ${result.scenarios.failed} | ${result.scenarios.total} | ${result.steps.passed} | ${result.steps.failed} | ${result.steps.total} | ${result.problems.join('; ')} |`
  );

  appendFileSync(
    summaryFile,
    [
      `## ${summary.suite}: ${summary.iterations.filter((result) => result.passed).length} of ${summary.iterationsRequested} iteration(s) passed`,
      '',
      '| Iteration | Result | Scenarios passed | Scenarios failed | Scenarios | Steps passed | Steps failed | Steps | Problems |',
      '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
      ...rows,
      '',
      factsError ? `Environment facts could not be collected: ${factsError}` : '',
      ''
    ].join('\n')
  );
}

function main(): void {
  const { suiteName, suite, iterations } = parseArgs(process.argv.slice(2));

  for (const target of Object.values(evidencePaths)) {
    removeIfPresent(target);
  }

  const results: IterationResult[] = [];

  for (let iteration = 1; iteration <= iterations; iteration += 1) {
    const result = runIteration(iteration, suite);
    results.push(result);
    logger.info(iterationLine(result));

    if (result.problems.some((problem) => problem.startsWith('seed failed'))) {
      break;
    }
  }

  for (let iteration = results.length + 1; iteration <= iterations; iteration += 1) {
    results.push({
      iteration,
      seeded: false,
      exitCode: null,
      scenarios: emptyCounts(),
      steps: emptyCounts(),
      passed: false,
      problems: ['not run because the seed failed']
    });
  }

  mergeAllureResults(results);

  const summary: RunSummary = {
    suite: suiteName,
    iterationsRequested: iterations,
    iterations: results,
    passed: results.every((result) => result.passed)
  };

  mkdirSync(evidencePaths.iterationsDir, { recursive: true });
  writeFileSync(evidencePaths.runSummary, JSON.stringify(summary, null, 2));

  let factsError: string | undefined;

  try {
    const facts = collectEnvironmentFacts(suiteName, iterations, suite.usesLocalStack);
    writeFileSync(evidencePaths.environmentFacts, JSON.stringify(facts, null, 2));
    logger.info('Environment facts read from the running stack', facts);
  } catch (error) {
    factsError = (error as Error).message;
    logger.error(`Environment facts could not be collected: ${factsError}`);
  }

  const reportStatus = runNpm(['run', 'report:allure']);

  logger.info(`${suiteName}: ${results.filter((result) => result.passed).length} of ${iterations} iteration(s) passed`);

  for (const result of results) {
    logger.info(iterationLine(result));
  }

  writeStepSummary(summary, factsError);

  if (reportStatus !== 0) {
    logger.error(`Allure report generation failed with exit code ${reportStatus}.`);
  }

  process.exitCode = summary.passed && !factsError && reportStatus === 0 ? 0 : 1;
}

try {
  main();
} catch (error) {
  logger.error((error as Error).message);
  process.exitCode = 1;
}
