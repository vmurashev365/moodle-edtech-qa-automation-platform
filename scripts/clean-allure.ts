import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';

const targets = [
  path.resolve('reports', 'allure-results'),
  path.resolve('reports', 'allure-report'),
  path.resolve('reports', 'cucumber', 'cucumber-report.json')
];

for (const target of targets) {
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
  }
}

console.log('[clean:allure] removed previous Allure and Cucumber report artifacts');
