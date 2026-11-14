import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { buildEntityRegistry, type EntityRegistry } from '../domain/controlled-entities';

// Written by `npm run moodle:seed`; ignored by Git. It holds no passwords.
export const seedArtifactPath = path.resolve('artifacts', 'seed', 'controlled-data.generated.json');

const seedHint = 'Run npm run moodle:seed:ready against the running controlled Moodle stack.';

export function loadEntityRegistry(artifactPath: string = seedArtifactPath): EntityRegistry {
  if (!existsSync(artifactPath)) {
    throw new Error(`The controlled Moodle seed artifact ${artifactPath} does not exist. ${seedHint}`);
  }

  let artifact: unknown;

  try {
    artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));
  } catch (error) {
    throw new Error(`The seed artifact ${artifactPath} is not valid JSON: ${(error as Error).message} ${seedHint}`);
  }

  try {
    return buildEntityRegistry(artifact);
  } catch (error) {
    throw new Error(`${(error as Error).message} (${artifactPath}) ${seedHint}`);
  }
}
