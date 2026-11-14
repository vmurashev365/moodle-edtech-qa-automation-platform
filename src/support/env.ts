import * as dotenv from 'dotenv';
import { localDemoUserPassword } from './demo-credentials';
import { readIntegerEnv } from './env-values';
import { resolveRuntimeProfile, type TraceMode, type VideoMode } from './runtime-profile';

dotenv.config();

export interface TestEnv {
  baseUrl: string;
  adminUsername: string;
  adminPassword: string;
  teacherUsername: string;
  teacherPassword: string;
  studentUsername: string;
  studentPassword: string;
  studentEmail: string;
  managerUsername: string;
  managerPassword: string;
  apiToken: string;
  courseName: string;
  assignmentName: string;
  audioResourceName: string;
  targetGrade: number;
  courseId: string;
  assignmentId: string;
  assignmentGradeItemId: string;
  studentId: string;
  submissionId: string;
  courseUrl: string;
  assignmentUrl: string;
  assignmentSubmissionsUrl: string;
  assignmentGradingUrl: string;
  gradebookUrl: string;
  studentDisplayName: string;
  readyTimeoutMs: number;
  executionProfile: 'demo' | 'fast';
  headless: boolean;
  slowMoMs: number;
  stepDelayMs: number;
  screencastEnabled: boolean;
  traceMode: TraceMode;
  videoMode: VideoMode;
  terminalStepsEnabled: boolean;
  traceOnFailure: boolean;
  videoOnFailure: boolean;
}

export interface EnvValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  summary: Record<string, string | number | boolean>;
}

function readEnv(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

function readSeededUserPassword(name: string): string {
  const value = readEnv(name, localDemoUserPassword);
  return value === 'changeme' ? localDemoUserPassword : value;
}

// The only definition of "API token configured": a whitespace-only token is not a token. Used by the
// environment contract, MoodleClient and the data readiness checks so they cannot disagree.
export function isApiTokenConfigured(token: string | undefined): boolean {
  return (token ?? '').trim().length > 0;
}

export const missingApiTokenWarning =
  'MOODLE_API_TOKEN is not configured; Moodle Web Service mutation and validation helpers remain pending.';

// The seed creates the controlled assignment with a maximum grade of 100 and whole-number grades.
export const targetGradeRange = { min: 0, max: 100 };

export function loadEnv(): TestEnv {
  const runtimeProfile = resolveRuntimeProfile();

  return {
    baseUrl: readEnv('MOODLE_BASE_URL', 'http://localhost:8080'),
    adminUsername: readEnv('MOODLE_ADMIN_USERNAME', 'user'),
    adminPassword: readEnv('MOODLE_ADMIN_PASSWORD', 'changeme'),
    teacherUsername: readEnv('MOODLE_TEACHER_USERNAME', 'teacher.qa'),
    teacherPassword: readSeededUserPassword('MOODLE_TEACHER_PASSWORD'),
    studentUsername: readEnv('MOODLE_STUDENT_USERNAME', 'student.qa'),
    studentPassword: readSeededUserPassword('MOODLE_STUDENT_PASSWORD'),
    studentEmail: readEnv('MOODLE_STUDENT_EMAIL', 'student.qa@example.test'),
    managerUsername: readEnv('MOODLE_MANAGER_USERNAME', 'manager.qa'),
    managerPassword: readEnv('MOODLE_MANAGER_PASSWORD', 'changeme'),
    apiToken: readEnv('MOODLE_API_TOKEN', ''),
    courseName: readEnv('MOODLE_COURSE_NAME', 'QA Automation Demo 101'),
    assignmentName: readEnv('MOODLE_ASSIGNMENT_NAME', 'Essay: Test Automation Strategy'),
    audioResourceName: readEnv('MOODLE_AUDIO_RESOURCE_NAME', 'Sample Listening Task'),
    targetGrade: readIntegerEnv(process.env, 'MOODLE_TARGET_GRADE', targetGradeRange) ?? 82,
    courseId: readEnv('MOODLE_COURSE_ID', ''),
    assignmentId: readEnv('MOODLE_ASSIGNMENT_ID', ''),
    assignmentGradeItemId: readEnv('MOODLE_ASSIGNMENT_GRADE_ITEM_ID', ''),
    studentId: readEnv('MOODLE_STUDENT_ID', ''),
    submissionId: readEnv('MOODLE_SUBMISSION_ID', ''),
    courseUrl: readEnv('MOODLE_COURSE_URL', ''),
    assignmentUrl: readEnv('MOODLE_ASSIGNMENT_URL', ''),
    assignmentSubmissionsUrl: readEnv('MOODLE_ASSIGNMENT_SUBMISSIONS_URL', ''),
    assignmentGradingUrl: readEnv('MOODLE_ASSIGNMENT_GRADING_URL', ''),
    gradebookUrl: readEnv('MOODLE_GRADEBOOK_URL', ''),
    studentDisplayName: readEnv('MOODLE_STUDENT_DISPLAY_NAME', ''),
    readyTimeoutMs: readIntegerEnv(process.env, 'MOODLE_READY_TIMEOUT_MS', { min: 1 }) ?? 180000,
    executionProfile: runtimeProfile.name,
    headless: runtimeProfile.headless,
    slowMoMs: runtimeProfile.slowMoMs,
    stepDelayMs: runtimeProfile.stepDelayMs,
    screencastEnabled: runtimeProfile.screencastEnabled,
    traceMode: runtimeProfile.traceMode,
    videoMode: runtimeProfile.videoMode,
    terminalStepsEnabled: runtimeProfile.terminalStepsEnabled,
    traceOnFailure: runtimeProfile.traceMode === 'retain-on-failure',
    videoOnFailure: runtimeProfile.videoMode === 'retain-on-failure'
  };
}

export function validateEnvContract(env: TestEnv = loadEnv()): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const parsedUrl = new URL(env.baseUrl);

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      errors.push('MOODLE_BASE_URL must use http or https.');
    }
  } catch {
    errors.push('MOODLE_BASE_URL must be a valid URL.');
  }

  if (!env.courseName) {
    errors.push('MOODLE_COURSE_NAME is required.');
  }

  if (!env.assignmentName) {
    errors.push('MOODLE_ASSIGNMENT_NAME is required.');
  }

  if (!env.audioResourceName) {
    warnings.push('MOODLE_AUDIO_RESOURCE_NAME is empty; media smoke scenarios will remain blocked.');
  }

  if (!isApiTokenConfigured(env.apiToken)) {
    warnings.push(missingApiTokenWarning);
  }

  for (const [key, value] of Object.entries({
    MOODLE_ADMIN_PASSWORD: env.adminPassword,
    MOODLE_TEACHER_PASSWORD: env.teacherPassword,
    MOODLE_STUDENT_PASSWORD: env.studentPassword,
    MOODLE_MANAGER_PASSWORD: env.managerPassword
  })) {
    if (value === 'changeme') {
      warnings.push(`${key} still uses the .env.example placeholder value.`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary: {
      baseUrl: env.baseUrl,
      teacherUsername: env.teacherUsername,
      studentUsername: env.studentUsername,
      studentEmail: env.studentEmail,
      managerUsername: env.managerUsername,
      courseName: env.courseName,
      assignmentName: env.assignmentName,
      audioResourceName: env.audioResourceName,
      targetGrade: env.targetGrade,
      courseNavigationConfigured: Boolean(env.courseId || env.courseUrl),
      assignmentNavigationConfigured: Boolean(env.assignmentId || env.assignmentUrl),
      submissionsNavigationConfigured: Boolean(env.assignmentSubmissionsUrl || env.assignmentId || env.assignmentUrl),
      gradingNavigationConfigured: Boolean(env.assignmentGradingUrl || env.assignmentId || env.assignmentUrl),
      studentDisplayNameConfigured: Boolean(env.studentDisplayName),
      readyTimeoutMs: env.readyTimeoutMs,
      apiTokenConfigured: isApiTokenConfigured(env.apiToken),
      executionProfile: env.executionProfile,
      headless: env.headless,
      slowMoMs: env.slowMoMs,
      stepDelayMs: env.stepDelayMs,
      screencastEnabled: env.screencastEnabled,
      traceMode: env.traceMode,
      videoMode: env.videoMode,
      terminalStepsEnabled: env.terminalStepsEnabled,
      traceOnFailure: env.traceOnFailure,
      videoOnFailure: env.videoOnFailure
    }
  };
}
