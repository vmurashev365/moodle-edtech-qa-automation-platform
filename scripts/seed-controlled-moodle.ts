import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { localDemoUserPassword } from '../src/support/demo-credentials';
import { loadEnv } from '../src/support/env';
import { requireDocker, requireRunningMoodleService, runMoodleCliScript } from '../src/support/moodle-cli';
import { logger } from '../src/utils/logger';

interface SeedUserOutput {
  id: number;
  username: string;
  displayName: string;
  email: string;
}

interface SeedOutput {
  generatedAt: string;
  baseUrl: string;
  users: {
    teacher: SeedUserOutput;
    student: SeedUserOutput;
  };
  course: {
    id: number;
    shortName: string;
    fullName: string;
    idNumber: string;
    url: string;
  };
  assignment: {
    instanceId: number;
    cmid: number;
    name: string;
    url: string;
    submissionsUrl: string;
    gradingUrl: string;
    maxGrade: number;
  };
  submission: {
    id: number;
    status: string;
    text: string;
  };
  gradebook: {
    url: string;
    gradeItemId: number;
    targetGrade: number;
    baseline: {
      mode: string;
      assignGrade: number;
      expectedBeforeUiGrade: string;
    };
  };
  envSnippet: Record<string, string>;
  notes: string[];
}

const seedScriptPath = '/qa-seed/seed-controlled-data.php';
const artifactPath = path.resolve('artifacts', 'seed', 'controlled-data.generated.json');

function buildSeedEnv(): Record<string, string> {
  const env = loadEnv();

  return {
    MOODLE_BASE_URL: env.baseUrl,
    MOODLE_TEACHER_USERNAME: env.teacherUsername,
    MOODLE_TEACHER_PASSWORD: env.teacherPassword,
    MOODLE_STUDENT_USERNAME: env.studentUsername,
    MOODLE_STUDENT_PASSWORD: env.studentPassword,
    MOODLE_STUDENT_DISPLAY_NAME: env.studentDisplayName || 'Student QA',
    MOODLE_STUDENT_EMAIL: env.studentEmail || 'student.qa@example.test',
    MOODLE_COURSE_NAME: env.courseName,
    MOODLE_ASSIGNMENT_NAME: env.assignmentName,
    MOODLE_TARGET_GRADE: String(env.targetGrade)
  };
}

function parseSeedOutput(stdout: string): SeedOutput {
  try {
    return JSON.parse(stdout) as SeedOutput;
  } catch (error) {
    throw new Error(
      [
        'Moodle seed script did not return valid JSON.',
        `Parse error: ${(error as Error).message}`,
        stdout.trim() ? `Raw stdout: ${stdout.trim()}` : 'Raw stdout was empty.'
      ].join('\n')
    );
  }
}

function writeArtifact(seedOutput: SeedOutput): void {
  mkdirSync(path.dirname(artifactPath), { recursive: true });
  writeFileSync(artifactPath, `${JSON.stringify(seedOutput, null, 2)}\n`, { encoding: 'utf8' });
}

function printSummary(seedOutput: SeedOutput): void {
  logger.info('Controlled Moodle seed completed.');
  logger.info(`Teacher username: ${seedOutput.users.teacher.username}`);
  logger.info(`Student username: ${seedOutput.users.student.username}`);
  logger.info(`Student display name: ${seedOutput.users.student.displayName}`);
  logger.info(`Course ID: ${seedOutput.course.id}`);
  logger.info(`Course URL: ${seedOutput.course.url}`);
  logger.info(`Assignment instance ID: ${seedOutput.assignment.instanceId}`);
  logger.info(`Assignment CMID: ${seedOutput.assignment.cmid}`);
  logger.info(`Assignment URL: ${seedOutput.assignment.url}`);
  logger.info(`Submissions URL: ${seedOutput.assignment.submissionsUrl}`);
  logger.info(`Assignment grading URL: ${seedOutput.assignment.gradingUrl}`);
  logger.info(`Gradebook URL: ${seedOutput.gradebook.url}`);
  logger.info(`Assignment grade item ID: ${seedOutput.gradebook.gradeItemId}`);
  logger.info(`Seeded grade baseline: ${seedOutput.gradebook.baseline.expectedBeforeUiGrade}`);
  logger.info(`Target grade: ${seedOutput.gradebook.targetGrade}`);
  logger.info(`Generated Moodle metadata has been written to: ${artifactPath}`);

  if (seedOutput.notes.length > 0) {
    for (const note of seedOutput.notes) {
      logger.warn(note);
    }
  }

  console.log('');
  console.log('Generated .env metadata snippet:');
  console.log('');
  for (const [key, value] of Object.entries(seedOutput.envSnippet)) {
    console.log(`${key}=${value}`);
  }
  console.log('');
  console.log('Next local readiness steps:');
  console.log('  npm run moodle:seed:env');
  console.log('  npm run check:data');
  console.log('  npm run check:grading-data');
  console.log('');
  console.log(
    `Credential note: teacher/student passwords come from your local env; blank or legacy placeholder values are seeded with the local demo default "${localDemoUserPassword}".`
  );
}

function runSeed(): SeedOutput {
  const result = runMoodleCliScript(seedScriptPath, {
    env: buildSeedEnv(),
    secretEnvNames: ['MOODLE_TEACHER_PASSWORD', 'MOODLE_STUDENT_PASSWORD']
  });

  if (result.stderr.trim()) {
    logger.warn(result.stderr.trim());
  }

  return parseSeedOutput(result.stdout);
}

function main(): void {
  requireDocker();
  requireRunningMoodleService();

  const seedOutput = runSeed();
  writeArtifact(seedOutput);
  printSummary(seedOutput);
}

try {
  main();
} catch (error) {
  logger.error((error as Error).message);
  process.exitCode = 1;
}
