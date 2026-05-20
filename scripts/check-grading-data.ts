import { validateControlledGradingReadiness } from '../src/support/data-readiness';
import { loadEnv } from '../src/support/env';
import { logger } from '../src/utils/logger';

const env = loadEnv();
const result = validateControlledGradingReadiness(env);

logger.info('Controlled Moodle Phase 6 grading readiness summary', result.summary);

for (const warning of result.warnings) {
  logger.warn(warning);
}

for (const error of result.errors) {
  logger.error(error);
}

if (!result.ok) {
  logger.error(
    'Controlled grading data is not ready for Phase 6. This script validates the local data contract only; it does not create Moodle data or fake gradebook evidence.'
  );
  process.exitCode = 1;
}
