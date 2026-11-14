import type { Page } from 'playwright';
import { assertComparison, type ComparisonRecord } from '../domain/comparison';

interface AttachmentWorld {
  attach(data: string, options: { mediaType: string; fileName?: string }): void | Promise<void>;
  attach(data: Buffer, options: string | { mediaType: string; fileName?: string }): void | Promise<void>;
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

// The title is also the attachment's name in the report, so a reader sees what each attachment is.
export async function attachJson(world: AttachmentWorld, title: string, payload: unknown): Promise<void> {
  await world.attach(JSON.stringify({ title, payload }, null, 2), { mediaType: 'application/json', fileName: title });
}

// Attach before asserting, so the comparison is in the report whether the step passes or fails.
export async function attachComparison(world: AttachmentWorld, name: string, record: ComparisonRecord): Promise<void> {
  await world.attach(JSON.stringify(record, null, 2), { mediaType: 'application/json', fileName: name });
}

// For a check made in the browser. The page assertions wait for the page and keep their own strictness; the
// comparison is then built from what the page shows and attached, and only after that does the step fail, on
// the comparison or on the page assertions. A passing step therefore means both agreed.
export async function verifyWithComparison(
  world: AttachmentWorld,
  name: string,
  pageAssertions: () => Promise<void>,
  compare: () => Promise<ComparisonRecord>
): Promise<void> {
  let pageAssertionError: Error | undefined;

  try {
    await pageAssertions();
  } catch (error) {
    pageAssertionError =
      error instanceof Error ? error : new Error('The page assertions failed with a non-Error value.');
  }

  const comparison = await compare();

  await attachComparison(world, name, comparison);
  assertComparison(comparison);

  if (pageAssertionError) {
    throw pageAssertionError;
  }
}

export async function attachText(world: AttachmentWorld, title: string, content: string): Promise<void> {
  await world.attach(`${title}\n\n${content}`, { mediaType: 'text/plain', fileName: title });
}

export async function attachScreenshotOnFailure(
  world: AttachmentWorld,
  scenarioName: string,
  page: Page
): Promise<void> {
  const screenshot = await page.screenshot({
    path: `screenshots/${sanitizeFileName(scenarioName)}.png`,
    fullPage: true
  });

  await world.attach(screenshot, 'image/png');
}
