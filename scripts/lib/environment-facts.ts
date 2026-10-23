import { readFileSync, existsSync } from 'node:fs';

import { moodleServiceName, runCommand, runMoodleCliScript } from '../../src/support/moodle-cli';
import { evidencePaths } from './evidence-run';

// Facts about the stack the suite actually ran on. They are read from the running container, never
// from the comment in docker-compose.yml, because MOODLE_DOCKER_IMAGE can override the image.

export interface EnvironmentFacts {
  suite: string;
  iterations: number;
  commitSha: string;
  ref?: string;
  runUrl?: string;
  moodle?: {
    release: string;
    version: string;
    branch?: string;
  };
  moodleImage?: {
    reference: string;
    imageId: string;
    digest: string;
    repoDigests: string[];
  };
  collectedAt: string;
}

const releaseScriptPath = '/qa-seed/read-moodle-release.php';

export function githubRunUrl(): string | undefined {
  const { GITHUB_SERVER_URL: serverUrl, GITHUB_REPOSITORY: repository, GITHUB_RUN_ID: runId } = process.env;

  return serverUrl && repository && runId ? `${serverUrl}/${repository}/actions/runs/${runId}` : undefined;
}

function commitSha(): string {
  return process.env.GITHUB_SHA || runCommand('git', ['rev-parse', 'HEAD']).stdout.trim();
}

function readMoodleRelease(): NonNullable<EnvironmentFacts['moodle']> {
  const stdout = runMoodleCliScript(releaseScriptPath).stdout.trim();
  const payload = JSON.parse(stdout) as { release?: string; version?: string; branch?: string | null };

  if (!payload.release || !payload.version) {
    throw new Error(`Moodle CLI did not report a release and version: ${stdout}`);
  }

  return { release: payload.release, version: payload.version, branch: payload.branch ?? undefined };
}

function repositoryOf(reference: string): string {
  const withoutDigest = reference.split('@')[0];
  const lastSlash = withoutDigest.lastIndexOf('/');
  const lastColon = withoutDigest.lastIndexOf(':');

  return lastColon > lastSlash ? withoutDigest.slice(0, lastColon) : withoutDigest;
}

function readMoodleImage(): NonNullable<EnvironmentFacts['moodleImage']> {
  const containerId = runCommand('docker', ['compose', 'ps', '-q', moodleServiceName]).stdout.trim();

  if (!containerId || containerId.includes('\n')) {
    throw new Error(
      `Expected exactly one running "${moodleServiceName}" container; docker compose ps returned "${containerId}".`
    );
  }

  const [container] = JSON.parse(runCommand('docker', ['inspect', containerId]).stdout) as {
    Image: string;
    Config: { Image: string };
  }[];
  const [image] = JSON.parse(runCommand('docker', ['image', 'inspect', container.Image]).stdout) as {
    RepoDigests?: string[];
  }[];
  const repoDigests = image.RepoDigests ?? [];
  const repository = repositoryOf(container.Config.Image);
  const digest = repoDigests.find((entry) => entry.startsWith(`${repository}@`)) ?? repoDigests[0];

  if (!digest) {
    throw new Error(
      `The running Moodle image ${container.Config.Image} has no registry digest (RepoDigests is empty), so the evidence cannot name the exact image.`
    );
  }

  return { reference: container.Config.Image, imageId: container.Image, digest, repoDigests };
}

export function collectEnvironmentFacts(suite: string, iterations: number, usesLocalStack: boolean): EnvironmentFacts {
  return {
    suite,
    iterations,
    commitSha: commitSha(),
    ref: process.env.GITHUB_REF_NAME,
    runUrl: githubRunUrl(),
    moodle: usesLocalStack ? readMoodleRelease() : undefined,
    moodleImage: usesLocalStack ? readMoodleImage() : undefined,
    collectedAt: new Date().toISOString()
  };
}

export function readEnvironmentFacts(): EnvironmentFacts | undefined {
  if (!existsSync(evidencePaths.environmentFacts)) {
    return undefined;
  }

  return JSON.parse(readFileSync(evidencePaths.environmentFacts, 'utf8')) as EnvironmentFacts;
}
