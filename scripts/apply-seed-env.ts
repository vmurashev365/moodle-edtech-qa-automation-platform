import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { logger } from '../src/utils/logger';

interface SeedArtifact {
  baseUrl?: string;
  users?: {
    teacher?: {
      username?: string;
    };
    student?: {
      id?: number | string;
      username?: string;
      displayName?: string;
      email?: string;
    };
  };
  course?: {
    id?: number | string;
    fullName?: string;
    url?: string;
  };
  assignment?: {
    cmid?: number | string;
    name?: string;
    url?: string;
    submissionsUrl?: string;
    gradingUrl?: string;
  };
  submission?: {
    id?: number | string;
  };
  gradebook?: {
    url?: string;
    gradeItemId?: number | string;
    targetGrade?: number | string;
  };
  envSnippet?: Record<string, string>;
}

interface EnvLine {
  raw: string;
  key?: string;
  value?: string;
}

const seedArtifactPath = path.resolve('artifacts', 'seed', 'controlled-data.generated.json');
const envPath = path.resolve('.env');
const envExamplePath = path.resolve('.env.example');
const localDemoPassword = 'QaDemo2026!';

const deterministicKeys = [
  'MOODLE_BASE_URL',
  'MOODLE_TEACHER_USERNAME',
  'MOODLE_STUDENT_USERNAME',
  'MOODLE_STUDENT_DISPLAY_NAME',
  'MOODLE_COURSE_NAME',
  'MOODLE_COURSE_ID',
  'MOODLE_COURSE_URL',
  'MOODLE_ASSIGNMENT_NAME',
  'MOODLE_ASSIGNMENT_ID',
  'MOODLE_ASSIGNMENT_GRADE_ITEM_ID',
  'MOODLE_STUDENT_ID',
  'MOODLE_STUDENT_EMAIL',
  'MOODLE_SUBMISSION_ID',
  'MOODLE_ASSIGNMENT_URL',
  'MOODLE_ASSIGNMENT_SUBMISSIONS_URL',
  'MOODLE_ASSIGNMENT_GRADING_URL',
  'MOODLE_GRADEBOOK_URL',
  'MOODLE_TARGET_GRADE'
] as const;

type DeterministicKey = (typeof deterministicKeys)[number];

const deterministicKeySet = new Set<string>(deterministicKeys);
const passwordKeys = ['MOODLE_TEACHER_PASSWORD', 'MOODLE_STUDENT_PASSWORD'] as const;

function readSeedArtifact(): SeedArtifact {
  if (!existsSync(seedArtifactPath)) {
    throw new Error(
      [
        `Seed artifact not found: ${seedArtifactPath}`,
        'Run the local Moodle seed first:',
        '  npm run moodle:seed'
      ].join('\n')
    );
  }

  try {
    return JSON.parse(readFileSync(seedArtifactPath, 'utf8')) as SeedArtifact;
  } catch (error) {
    throw new Error(`Could not parse ${seedArtifactPath}: ${(error as Error).message}`);
  }
}

function isSafeGeneratedMetadataKey(key: string): boolean {
  return /^MOODLE_[A-Z0-9_]+$/.test(key) && !/(PASSWORD|TOKEN|SECRET|DB|EMAIL)/.test(key);
}

function keysToSync(seed: SeedArtifact): string[] {
  const keys = new Set<string>(deterministicKeys);

  for (const key of Object.keys(seed.envSnippet ?? {})) {
    if (isSafeGeneratedMetadataKey(key)) {
      keys.add(key);
    }
  }

  return [...keys];
}

function requireValue(seed: SeedArtifact, key: string): string {
  const directValue = seed.envSnippet?.[key];

  if (directValue !== undefined && directValue !== '') {
    return directValue;
  }

  if (!deterministicKeySet.has(key)) {
    throw new Error(`Seed artifact is missing generated value for ${key}. Re-run npm run moodle:seed.`);
  }

  const derived: Partial<Record<DeterministicKey, string | number | undefined>> = {
    MOODLE_BASE_URL: seed.baseUrl,
    MOODLE_TEACHER_USERNAME: seed.users?.teacher?.username,
    MOODLE_STUDENT_USERNAME: seed.users?.student?.username,
    MOODLE_STUDENT_DISPLAY_NAME: seed.users?.student?.displayName,
    MOODLE_COURSE_NAME: seed.course?.fullName,
    MOODLE_COURSE_ID: seed.course?.id,
    MOODLE_COURSE_URL: seed.course?.url,
    MOODLE_ASSIGNMENT_NAME: seed.assignment?.name,
    MOODLE_ASSIGNMENT_ID: seed.assignment?.cmid,
    MOODLE_ASSIGNMENT_GRADE_ITEM_ID: seed.gradebook?.gradeItemId,
    MOODLE_STUDENT_ID: seed.users?.student?.id,
    MOODLE_STUDENT_EMAIL: seed.users?.student?.email,
    MOODLE_SUBMISSION_ID: seed.submission?.id,
    MOODLE_ASSIGNMENT_URL: seed.assignment?.url,
    MOODLE_ASSIGNMENT_SUBMISSIONS_URL: seed.assignment?.submissionsUrl,
    MOODLE_ASSIGNMENT_GRADING_URL: seed.assignment?.gradingUrl,
    MOODLE_GRADEBOOK_URL: seed.gradebook?.url,
    MOODLE_TARGET_GRADE: seed.gradebook?.targetGrade
  };
  const value = derived[key as DeterministicKey];

  if (value === undefined || String(value).trim() === '') {
    throw new Error(`Seed artifact is missing required value for ${key}. Re-run npm run moodle:seed.`);
  }

  return String(value);
}

function ensureEnvFile(): { created: boolean; backupPath?: string } {
  if (!existsSync(envPath)) {
    if (!existsSync(envExamplePath)) {
      throw new Error(`Cannot create .env because .env.example was not found at ${envExamplePath}.`);
    }

    copyFileSync(envExamplePath, envPath);
    return { created: true };
  }

  const backupPath = path.resolve(`.env.backup.${timestampForFile()}`);
  copyFileSync(envPath, backupPath);
  return { created: false, backupPath };
}

function timestampForFile(): string {
  return new Date()
    .toISOString()
    .replace(/\.\d{3}Z$/, '')
    .replace(/:/g, '-');
}

function parseEnvLines(content: string): EnvLine[] {
  return content.split(/\r?\n/).map((raw) => {
    const match = raw.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);

    if (!match) {
      return { raw };
    }

    return {
      raw,
      key: match[1],
      value: match[2]
    };
  });
}

function renderEnvLines(lines: EnvLine[]): string {
  return `${lines
    .map((line) => line.raw)
    .join('\n')
    .replace(/\n+$/, '')}\n`;
}

function setEnvValue(
  lines: EnvLine[],
  key: string,
  value: string
): { action: 'added' | 'changed' | 'unchanged'; previous?: string } {
  const existing = lines.find((line) => line.key === key);

  if (!existing) {
    lines.push({ raw: `${key}=${value}`, key, value });
    return { action: 'added' };
  }

  if (existing.value === value) {
    return { action: 'unchanged', previous: existing.value };
  }

  const previous = existing.value;
  existing.value = value;
  existing.raw = `${key}=${value}`;
  return { action: 'changed', previous };
}

function hasNonBlankValue(lines: EnvLine[], key: string): boolean {
  const existing = lines.find((line) => line.key === key);
  return Boolean(existing?.value?.trim());
}

function applySeedEnv(): void {
  const seed = readSeedArtifact();
  const fileState = ensureEnvFile();
  const lines = parseEnvLines(readFileSync(envPath, 'utf8'));
  const changedKeys: string[] = [];
  const unchangedKeys: string[] = [];
  const demoPasswordKeys: string[] = [];

  for (const key of keysToSync(seed)) {
    const value = requireValue(seed, key);
    const result = setEnvValue(lines, key, value);

    if (result.action === 'unchanged') {
      unchangedKeys.push(key);
    } else {
      changedKeys.push(key);
    }
  }

  for (const key of passwordKeys) {
    if (hasNonBlankValue(lines, key)) {
      continue;
    }

    const result = setEnvValue(lines, key, localDemoPassword);

    if (result.action !== 'unchanged') {
      changedKeys.push(key);
      demoPasswordKeys.push(key);
    }
  }

  writeFileSync(envPath, renderEnvLines(lines), { encoding: 'utf8' });

  if (fileState.created) {
    logger.info('Created local .env from .env.example before applying generated seed metadata.');
  } else if (fileState.backupPath) {
    logger.info(`Created .env backup before editing: ${fileState.backupPath}`);
  }

  logger.info(`Applied generated Moodle metadata from ${seedArtifactPath}.`);
  logger.info(`Changed keys: ${changedKeys.length > 0 ? changedKeys.join(', ') : 'none'}`);

  if (unchangedKeys.length > 0) {
    logger.info(`Already up to date: ${unchangedKeys.join(', ')}`);
  }

  if (demoPasswordKeys.length > 0) {
    logger.warn(
      `${demoPasswordKeys.join(', ')} were blank and were set to the documented local-only demo password "${localDemoPassword}".`
    );
  }

  logger.info('Next checks: npm run check:data && npm run check:grading-data');
}

try {
  applySeedEnv();
} catch (error) {
  logger.error((error as Error).message);
  process.exitCode = 1;
}
