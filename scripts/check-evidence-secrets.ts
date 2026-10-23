import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { gunzipSync, inflateRawSync } from 'node:zlib';

import * as dotenv from 'dotenv';

import { localDemoUserPassword } from '../src/support/demo-credentials';
import { logger } from '../src/utils/logger';
import { evidencePaths } from './lib/evidence-run';

// Refuses evidence that contains a credential. It looks for the actual values present in this job:
// the job environment, the generated .env (where apply-seed-env writes the local demo password) and
// the demo password itself. Output names variables, files and encodings, never a value.
//
// The single-file Allure report embeds every file as base64, and Playwright traces are zip archives,
// so the scan also decodes embedded base64 and unpacks zip and gzip content before matching.

const secretEnvNames = [
  'MOODLE_ADMIN_PASSWORD',
  'MOODLE_TEACHER_PASSWORD',
  'MOODLE_STUDENT_PASSWORD',
  'MOODLE_MANAGER_PASSWORD',
  'MOODLE_DB_PASSWORD',
  'MOODLE_DB_ROOT_PASSWORD',
  'MOODLE_API_TOKEN'
];
const minimumSecretLength = 6;
const maximumNestingDepth = 4;
// Both base64 alphabets. Eight characters encode six bytes, the shortest value scanned.
const embeddedBase64 = /[A-Za-z0-9+/_-]{8,}={0,2}/g;

interface Needle {
  form: string;
  bytes: Buffer;
}

interface Secret {
  labels: string[];
  needles: Needle[];
}

interface Finding {
  location: string;
  labels: string[];
  form: string;
}

function htmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function needlesFor(value: string): Needle[] {
  const forms: [string, string][] = [
    ['plain', value],
    ['JSON-escaped', JSON.stringify(value).slice(1, -1)],
    ['HTML-escaped', htmlEscape(value)],
    ['URL-encoded', encodeURIComponent(value)],
    ['form-encoded', encodeURIComponent(value).replace(/%20/g, '+')]
  ];
  const unique = new Map<string, Needle>();

  for (const [form, text] of forms) {
    if (!unique.has(text)) {
      unique.set(text, { form, bytes: Buffer.from(text, 'utf8') });
    }
  }

  return [...unique.values(), { form: 'UTF-16', bytes: Buffer.from(value, 'utf16le') }];
}

function collectSecrets(): Secret[] {
  const envPath = path.resolve('.env');
  const fileEnv = existsSync(envPath) ? dotenv.parse(readFileSync(envPath)) : {};
  const labelsByValue = new Map<string, string[]>();
  const add = (label: string, value: string | undefined): void => {
    if (value === undefined || value.trim() === '') {
      return;
    }

    if (value.length < minimumSecretLength) {
      throw new Error(
        `${label} is shorter than ${minimumSecretLength} characters and cannot be scanned reliably; refusing to publish.`
      );
    }

    labelsByValue.set(value, [...(labelsByValue.get(value) ?? []), label]);
  };

  for (const name of secretEnvNames) {
    add(`${name} (job environment)`, process.env[name]);
    add(`${name} (.env)`, fileEnv[name]);
  }

  add('local demo password (apply-seed-env)', localDemoUserPassword);

  return [...labelsByValue.entries()].map(([value, labels]) => ({ labels, needles: needlesFor(value) }));
}

function unzipEntries(buffer: Buffer): { name: string; data: Buffer }[] {
  const endOfDirectory = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));

  if (endOfDirectory < 0) {
    throw new Error('zip archive has no central directory');
  }

  const count = buffer.readUInt16LE(endOfDirectory + 10);
  let offset = buffer.readUInt32LE(endOfDirectory + 16);
  const entries: { name: string; data: Buffer }[] = [];

  if (count === 0xffff || offset === 0xffffffff) {
    throw new Error('ZIP64 archives are not supported');
  }

  for (let index = 0; index < count; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('zip central directory is malformed');
    }

    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength);

    if (flags & 0x1) {
      throw new Error(`zip entry ${name} is encrypted`);
    }

    if (
      compressedSize === 0xffffffff ||
      localOffset === 0xffffffff ||
      buffer.readUInt32LE(localOffset) !== 0x04034b50
    ) {
      throw new Error(`zip entry ${name} cannot be located`);
    }

    const dataStart = localOffset + 30 + buffer.readUInt16LE(localOffset + 26) + buffer.readUInt16LE(localOffset + 28);
    const raw = buffer.subarray(dataStart, dataStart + compressedSize);

    if (method !== 0 && method !== 8) {
      throw new Error(`zip entry ${name} uses unsupported compression method ${method}`);
    }

    entries.push({ name, data: method === 8 ? inflateRawSync(raw) : raw });
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

function scanBuffer(buffer: Buffer, location: string, secrets: Secret[], findings: Finding[], depth: number): number {
  let scannedBytes = buffer.length;

  for (const secret of secrets) {
    for (const needle of secret.needles) {
      if (buffer.includes(needle.bytes)) {
        findings.push({ location, labels: secret.labels, form: needle.form });
      }
    }
  }

  if (depth >= maximumNestingDepth) {
    return scannedBytes;
  }

  if (buffer.length > 4 && buffer.readUInt32LE(0) === 0x04034b50) {
    for (const entry of unzipEntries(buffer)) {
      scannedBytes += scanBuffer(entry.data, `${location} > zip entry ${entry.name}`, secrets, findings, depth + 1);
    }

    return scannedBytes;
  }

  if (buffer.length > 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
    return scannedBytes + scanBuffer(gunzipSync(buffer), `${location} > gzip content`, secrets, findings, depth + 1);
  }

  // A run may start mid-encoding (glued to other base64 characters), so each one is decoded from all
  // four character offsets; one of them lines up with any value encoded inside it.
  for (const match of buffer.toString('latin1').matchAll(embeddedBase64)) {
    for (let skip = 0; skip < 4 && match[0].length - skip >= 8; skip += 1) {
      const decoded = Buffer.from(match[0].slice(skip), 'base64');
      const offset = match.index + skip;
      scannedBytes += scanBuffer(decoded, `${location} > base64 at offset ${offset}`, secrets, findings, depth + 1);
    }
  }

  return scannedBytes;
}

function listFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const fullPath = path.join(directory, name);
    return statSync(fullPath).isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

function main(): void {
  const directory = path.resolve(process.argv[2] ?? evidencePaths.releaseAssets);

  if (!existsSync(directory) || listFiles(directory).length === 0) {
    throw new Error(`No release assets to scan in ${directory}; refusing to publish.`);
  }

  const secrets = collectSecrets();
  const files = listFiles(directory);
  const findings: Finding[] = [];
  let scannedBytes = 0;

  for (const file of files) {
    const relativePath = path.relative(directory, file);

    try {
      scannedBytes += scanBuffer(readFileSync(file), relativePath, secrets, findings, 0);
    } catch (error) {
      throw new Error(
        `${relativePath} could not be fully inspected (${(error as Error).message}); refusing to publish.`
      );
    }
  }

  const scope = `${files.length} file(s), ${(scannedBytes / 1024 / 1024).toFixed(1)} MiB including decoded content, for ${secrets.length} secret value(s) from ${secrets.flatMap((secret) => secret.labels).join(', ')}`;

  if (findings.length > 0) {
    const unique = [
      ...new Set(
        findings.map((finding) => `${finding.location}: value of ${finding.labels.join(' / ')} (${finding.form})`)
      )
    ];

    for (const line of unique.slice(0, 50)) {
      logger.error(`Secret guard: ${line}`);
    }

    logger.error(
      `Secret guard found ${unique.length} secret occurrence(s) in ${directory}; refusing to publish. Scanned ${scope}.`
    );
    process.exitCode = 1;
    return;
  }

  logger.info(`Secret guard: no secret values found. Scanned ${scope}.`);
}

try {
  main();
} catch (error) {
  logger.error(`Secret guard: ${(error as Error).message}`);
  process.exitCode = 1;
}
