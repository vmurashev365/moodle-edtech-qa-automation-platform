import { spawnSync } from 'node:child_process';
import path from 'node:path';

import { logger } from '../src/utils/logger';
import { emptySelectionMessage, inspectScenarioSelection } from './lib/scenario-guard';

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

async function main(): Promise<void> {
  const { cucumberArgs, label } = parseArgs(process.argv.slice(2));
  const cucumberBin = path.resolve('node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber-js');
  const selection = await inspectScenarioSelection(cucumberArgs);

  if (selection.selected === 0) {
    logger.error(emptySelectionMessage(label, selection));
    process.exitCode = 1;
    return;
  }

  logger.info(`${label} selected ${selection.selected} executable Cucumber scenario(s).`);

  const result = spawnSync(process.execPath, [cucumberBin, ...cucumberArgs], {
    env: process.env,
    stdio: 'inherit',
    windowsHide: true
  });

  if (result.error) {
    throw result.error;
  }

  process.exitCode = result.status ?? 1;
}

main().catch((error: unknown) => {
  logger.error((error as Error).message);
  process.exitCode = 1;
});
