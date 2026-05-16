import { loadEnv } from '../src/support/env';
import { logger } from '../src/utils/logger';

const env = loadEnv();
const timeoutMs = env.readyTimeoutMs;
const intervalMs = 5000;
const start = Date.now();

async function probe(url: URL): Promise<boolean> {
  try {
    const response = await fetch(url, {
      redirect: 'follow'
    });

    if (!response.ok) {
      logger.info(`Moodle probe returned ${response.status} for ${url.toString()}.`);
      return false;
    }

    const body = await response.text();
    const hasMoodleMarker = /moodle|login/i.test(body);

    if (!hasMoodleMarker) {
      logger.info(`Moodle probe reached ${url.toString()} but did not find a lightweight Moodle page marker yet.`);
    }

    return true;
  } catch (error) {
    logger.info(`Moodle probe failed for ${url.toString()}: ${(error as Error).message}`);
    return false;
  }
}

async function waitForMoodle(): Promise<void> {
  const baseUrl = new URL(env.baseUrl);
  const loginUrl = new URL('/login/index.php', baseUrl);

  logger.info(`Waiting up to ${timeoutMs}ms for controlled Moodle at ${baseUrl.toString()}.`);

  while (Date.now() - start <= timeoutMs) {
    if ((await probe(loginUrl)) || (await probe(baseUrl))) {
      logger.info(`Controlled Moodle is reachable at ${baseUrl.toString()}.`);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Timed out after ${timeoutMs}ms waiting for controlled Moodle at ${baseUrl.toString()}.`);
}

waitForMoodle().catch((error) => {
  logger.error((error as Error).message);
  process.exitCode = 1;
});
