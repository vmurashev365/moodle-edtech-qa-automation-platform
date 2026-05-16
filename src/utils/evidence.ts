import type { Page } from 'playwright';

interface AttachmentWorld {
  attach(data: string | Buffer, mediaType: string): void | Promise<void>;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

export async function attachJson(world: AttachmentWorld, title: string, payload: unknown): Promise<void> {
  await world.attach(JSON.stringify({ title, payload }, null, 2), 'application/json');
}

export async function attachText(world: AttachmentWorld, title: string, content: string): Promise<void> {
  await world.attach(`${title}\n\n${content}`, 'text/plain');
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
