import { Before } from '@cucumber/cucumber';
import type { MoodleWorld } from './custom-world';

const availabilityTimeoutMs = 15_000;

export async function expectMoodleReachable(baseUrl: string): Promise<void> {
  let response: Response;

  try {
    response = await fetch(baseUrl, { redirect: 'follow', signal: AbortSignal.timeout(availabilityTimeoutMs) });
  } catch (error) {
    throw new Error(
      `Controlled Moodle is not reachable at ${baseUrl}: ${(error as Error).message}. ` +
        'Start it with npm run moodle:start and npm run moodle:wait.'
    );
  }

  if (!response.ok) {
    throw new Error(`Controlled Moodle is not reachable at ${baseUrl}; status ${response.status}.`);
  }
}

// Whether the stack is up is a fact about the environment, not about Moodle's behaviour, so it is checked
// here and scenarios do not have to say it.
Before({ tags: '@local and not @wip', name: 'Controlled Moodle is reachable' }, async function (this: MoodleWorld) {
  await expectMoodleReachable(this.env.baseUrl);
});
