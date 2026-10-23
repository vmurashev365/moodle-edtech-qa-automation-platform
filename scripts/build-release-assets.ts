import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import path from 'node:path';

import { logger } from '../src/utils/logger';
import { readEnvironmentFacts } from './lib/environment-facts';
import { evidencePaths, iterationDir, moodleSuites, readRunSummary, type IterationResult } from './lib/evidence-run';

// Packages the evidence of a passed scripts/run-moodle-suite.ts run as GitHub Release assets under
// reports/release-assets/. Run the secret guard on that folder before anything is uploaded.

// GitHub accepts release assets up to 2 GiB each. The screencast videos are capped well below that so a
// release stays downloadable; the single-file report embeds the same videos again.
const videoLimitBytes = 200 * 1024 * 1024;
const environmentStatement = 'controlled local Docker Moodle seeded with deterministic data';

interface AllureAttachment {
  name?: string;
  source?: string;
  type?: string;
}

interface AllureNode {
  name?: string;
  uuid?: string;
  children?: string[];
  attachments?: AllureAttachment[];
  steps?: AllureNode[];
  befores?: AllureNode[];
  afters?: AllureNode[];
}

function slug(value: string): string {
  return (
    value
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .slice(0, 80) || 'scenario'
  );
}

function attachmentSources(node: AllureNode): string[] {
  return [
    ...(node.attachments ?? []).map((attachment) => attachment.source ?? ''),
    ...[...(node.steps ?? []), ...(node.befores ?? []), ...(node.afters ?? [])].flatMap(attachmentSources)
  ].filter(Boolean);
}

// Maps each video attachment of one iteration to the scenario that recorded it. Attachments made in
// After hooks belong to the container, which names its scenario through `children`.
function iterationVideos(iteration: number): { source: string; scenario: string }[] {
  const resultsDir = path.join(iterationDir(iteration), 'allure-results');
  const files = readdirSync(resultsDir);
  const nodes = files
    .filter((file) => file.endsWith('-result.json') || file.endsWith('-container.json'))
    .map((file) => JSON.parse(readFileSync(path.join(resultsDir, file), 'utf8')) as AllureNode);
  const scenarioByUuid = new Map(nodes.filter((node) => node.uuid).map((node) => [node.uuid, node.name ?? 'scenario']));
  const scenarioBySource = new Map<string, string>();

  for (const node of nodes) {
    const scenario = node.children?.length ? scenarioByUuid.get(node.children[0]) : node.name;

    for (const source of attachmentSources(node)) {
      scenarioBySource.set(source, scenario ?? 'scenario');
    }
  }

  return files
    .filter((file) => file.endsWith('.webm'))
    .map((file) => ({ source: path.join(resultsDir, file), scenario: scenarioBySource.get(file) ?? 'scenario' }));
}

function copyVideos(iterations: IterationResult[]): string[] {
  const copied: string[] = [];
  let totalBytes = 0;

  for (const result of iterations) {
    iterationVideos(result.iteration).forEach((video, index) => {
      const name = `video-iteration-${result.iteration}-${index + 1}-${slug(video.scenario)}.webm`;

      totalBytes += statSync(video.source).size;

      if (totalBytes > videoLimitBytes) {
        throw new Error(
          `Screencast videos exceed the ${videoLimitBytes / 1024 / 1024} MiB release limit; publish fewer iterations.`
        );
      }

      copyFileSync(video.source, path.join(evidencePaths.releaseAssets, name));
      copied.push(name);
    });
  }

  if (copied.length === 0) {
    throw new Error('The screencast suite produced no video attachments to publish.');
  }

  return copied;
}

function requireSingleFileReport(): string {
  const indexPath = path.join(evidencePaths.allureReport, 'index.html');

  if (!existsSync(indexPath)) {
    throw new Error(`Allure report not found at ${indexPath}; run npm run ci:moodle-suite first.`);
  }

  const html = readFileSync(indexPath, 'utf8');

  if (!html.includes("d('data/") || /src="app\.js"/.test(html) || !html.includes('moodle-allure-branding')) {
    throw new Error(`${indexPath} is not a branded single-file Allure report; regenerate it with --single-file.`);
  }

  return indexPath;
}

function countsCell(counts: IterationResult['scenarios']): string {
  return `${counts.passed} / ${counts.failed} / ${counts.total}`;
}

function main(): void {
  const summary = readRunSummary();
  const facts = readEnvironmentFacts();

  if (!summary || !facts) {
    throw new Error('Run summary or environment facts are missing; run npm run ci:moodle-suite first.');
  }

  const suite = moodleSuites[summary.suite];

  if (!suite?.usesLocalStack || !facts.moodle || !facts.moodleImage) {
    throw new Error(
      `Only local controlled-Moodle suites with recorded Moodle facts are published; "${summary.suite}" is not one.`
    );
  }

  if (!summary.passed || summary.iterations.length !== summary.iterationsRequested) {
    throw new Error('Only runs in which every requested iteration passed are packaged for release.');
  }

  const reportPath = requireSingleFileReport();

  rmSync(evidencePaths.releaseAssets, { recursive: true, force: true });
  mkdirSync(evidencePaths.releaseAssets, { recursive: true });
  copyFileSync(reportPath, path.join(evidencePaths.releaseAssets, 'allure-report.html'));

  const assets = ['allure-report.html'];

  for (const result of summary.iterations) {
    const name = `cucumber-report-iteration-${result.iteration}.json`;
    copyFileSync(
      path.join(iterationDir(result.iteration), 'cucumber-report.json'),
      path.join(evidencePaths.releaseAssets, name)
    );
    assets.push(name);
  }

  const environmentSummary = {
    suite: summary.suite,
    environment: environmentStatement,
    commitSha: facts.commitSha,
    ref: facts.ref,
    runUrl: facts.runUrl,
    moodle: facts.moodle,
    moodleImage: facts.moodleImage,
    iterationsRequested: summary.iterationsRequested,
    iterations: summary.iterations.map(({ iteration, seeded, passed, scenarios, steps }) => ({
      iteration,
      seeded,
      passed,
      scenarios,
      steps
    })),
    collectedAt: facts.collectedAt
  };

  writeFileSync(
    path.join(evidencePaths.releaseAssets, 'environment-summary.json'),
    JSON.stringify(environmentSummary, null, 2)
  );
  assets.push('environment-summary.json');

  const videos = suite.screencast ? copyVideos(summary.iterations) : [];
  assets.push(...videos);

  const notes = [
    `Evidence from one manual run of the \`${summary.suite}\` suite on a ${environmentStatement}. The workflow started a fresh stack for this run; iteration 1 seeded it and later iterations reused it without re-seeding.`,
    '',
    '| Fact | Value |',
    '| --- | --- |',
    `| Suite | \`${summary.suite}\` |`,
    `| Commit | \`${facts.commitSha}\` |`,
    `| Moodle release | ${facts.moodle.release} |`,
    `| Moodle version | ${facts.moodle.version} |`,
    `| Moodle image | \`${facts.moodleImage.reference}\` |`,
    `| Image digest | \`${facts.moodleImage.digest}\` |`,
    `| Iterations | ${summary.iterationsRequested} |`,
    `| Run | ${facts.runUrl ?? 'not a GitHub Actions run (local)'} |`,
    '',
    '## Results per iteration',
    '',
    '| Iteration | Result | Scenarios passed / failed / total | Steps passed / failed / total |',
    '| --- | --- | --- | --- |',
    ...summary.iterations.map(
      (result) =>
        `| ${result.iteration} | ${result.passed ? 'passed' : 'failed'} | ${countsCell(result.scenarios)} | ${countsCell(result.steps)} |`
    ),
    '',
    'These numbers describe this run only.',
    '',
    '## Assets',
    '',
    '- `allure-report.html`: single-file Allure report; download it and open it in a browser, no server needed.',
    '- `cucumber-report-iteration-<n>.json`: Cucumber JSON for each iteration.',
    '- `environment-summary.json`: the facts and results above as JSON.',
    ...(videos.length > 0
      ? ['- `video-iteration-<n>-*.webm`: screencast videos, one per scenario and iteration.']
      : []),
    '',
    'This prerelease records test evidence; it is not a product version. The repository is private, so it is visible to repository collaborators only.',
    ''
  ].join('\n');

  writeFileSync(path.join(evidencePaths.releaseAssets, 'release-notes.md'), notes);
  logger.info(`Release assets written to ${evidencePaths.releaseAssets}: ${assets.join(', ')} (+ release-notes.md)`);
}

try {
  main();
} catch (error) {
  logger.error((error as Error).message);
  process.exitCode = 1;
}
