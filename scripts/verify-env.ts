import { validateEnvContract } from '../src/support/env';
import { logger } from '../src/utils/logger';

function main(): void {
  const result = validateEnvContract();

  logger.info('Controlled Moodle environment contract summary', result.summary);

  for (const warning of result.warnings) {
    logger.warn(warning);
  }

  for (const error of result.errors) {
    logger.error(error);
  }

  if (!result.ok) {
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  logger.error((error as Error).message);
  process.exitCode = 1;
}
