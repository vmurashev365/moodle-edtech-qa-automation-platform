import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';

const targets = [
  path.resolve('reports', 'allure-results'),
  path.resolve('reports', 'allure-report'),
  path.resolve('reports', 'cucumber', 'cucumber-report.json'),
  // Written by scripts/run-moodle-suite.ts; removed so a later plain report cannot show stale run facts.
  path.resolve('reports', 'iterations'),
  path.resolve('reports', 'environment-facts.json')
];

for (const target of targets) {
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
  }
}

console.log('[clean:allure] removed previous Allure and Cucumber report artifacts');
