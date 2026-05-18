import { validateControlledDataReadiness } from '../src/support/data-readiness';
import { loadEnv } from '../src/support/env';
import { logger } from '../src/utils/logger';

const env = loadEnv();
const result = validateControlledDataReadiness(env);

logger.info('Controlled Moodle Phase 5 data readiness summary', result.summary);

for (const warning of result.warnings) {
  logger.warn(warning);
}

for (const error of result.errors) {
  logger.error(error);
}

if (!result.ok) {
  logger.error(
    'Controlled data is not ready for the Phase 5 teacher workflow. This script validates the local data contract only; it does not create Moodle data.'
  );
  process.exitCode = 1;
}
