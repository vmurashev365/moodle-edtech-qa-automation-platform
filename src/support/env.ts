import * as dotenv from 'dotenv';

dotenv.config();

const localDemoUserPassword = 'QaDemo2026!';

export interface TestEnv {
  baseUrl: string;
  adminUsername: string;
  adminPassword: string;
  teacherUsername: string;
  teacherPassword: string;
  studentUsername: string;
  studentPassword: string;
  managerUsername: string;
  managerPassword: string;
  apiToken: string;
  courseName: string;
  assignmentName: string;
  audioResourceName: string;
  targetGrade: number;
  courseId: string;
  assignmentId: string;
  studentId: string;
  submissionId: string;
  courseUrl: string;
  assignmentUrl: string;
  assignmentSubmissionsUrl: string;
  gradebookUrl: string;
  studentDisplayName: string;
  readyTimeoutMs: number;
  headless: boolean;
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

function readBoolean(name: string, fallback: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();

  if (value === undefined || value === '') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value);
}

function readNumber(name: string, fallback: number): number {
  const value = process.env[name]?.trim();

  if (!value) {
    return fallback;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadEnv(): TestEnv {
  return {
    baseUrl: readEnv('MOODLE_BASE_URL', 'http://localhost:8080'),
    adminUsername: readEnv('MOODLE_ADMIN_USERNAME', 'user'),
    adminPassword: readEnv('MOODLE_ADMIN_PASSWORD', 'changeme'),
    teacherUsername: readEnv('MOODLE_TEACHER_USERNAME', 'teacher.qa'),
    teacherPassword: readSeededUserPassword('MOODLE_TEACHER_PASSWORD'),
    studentUsername: readEnv('MOODLE_STUDENT_USERNAME', 'student.qa'),
    studentPassword: readSeededUserPassword('MOODLE_STUDENT_PASSWORD'),
    managerUsername: readEnv('MOODLE_MANAGER_USERNAME', 'manager.qa'),
    managerPassword: readEnv('MOODLE_MANAGER_PASSWORD', 'changeme'),
    apiToken: readEnv('MOODLE_API_TOKEN', ''),
    courseName: readEnv('MOODLE_COURSE_NAME', 'QA Automation Demo 101'),
    assignmentName: readEnv('MOODLE_ASSIGNMENT_NAME', 'Essay: Test Automation Strategy'),
    audioResourceName: readEnv('MOODLE_AUDIO_RESOURCE_NAME', 'Sample Listening Task'),
    targetGrade: readNumber('MOODLE_TARGET_GRADE', 82),
    courseId: readEnv('MOODLE_COURSE_ID', ''),
    assignmentId: readEnv('MOODLE_ASSIGNMENT_ID', ''),
    studentId: readEnv('MOODLE_STUDENT_ID', ''),
    submissionId: readEnv('MOODLE_SUBMISSION_ID', ''),
    courseUrl: readEnv('MOODLE_COURSE_URL', ''),
    assignmentUrl: readEnv('MOODLE_ASSIGNMENT_URL', ''),
    assignmentSubmissionsUrl: readEnv('MOODLE_ASSIGNMENT_SUBMISSIONS_URL', ''),
    gradebookUrl: readEnv('MOODLE_GRADEBOOK_URL', ''),
    studentDisplayName: readEnv('MOODLE_STUDENT_DISPLAY_NAME', ''),
    readyTimeoutMs: readNumber('MOODLE_READY_TIMEOUT_MS', 180000),
    headless: readBoolean('HEADLESS', true),
    traceOnFailure: readBoolean('TRACE_ON_FAILURE', true),
    videoOnFailure: readBoolean('VIDEO_ON_FAILURE', false)
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

  if (!Number.isFinite(env.targetGrade)) {
    errors.push('MOODLE_TARGET_GRADE must be numeric.');
  }

  if (!env.apiToken) {
    warnings.push('MOODLE_API_TOKEN is not configured; mutation and backend reconciliation helpers remain pending.');
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
      managerUsername: env.managerUsername,
      courseName: env.courseName,
      assignmentName: env.assignmentName,
      audioResourceName: env.audioResourceName,
      targetGrade: env.targetGrade,
      courseNavigationConfigured: Boolean(env.courseId || env.courseUrl),
      assignmentNavigationConfigured: Boolean(env.assignmentId || env.assignmentUrl),
      submissionsNavigationConfigured: Boolean(env.assignmentSubmissionsUrl || env.assignmentId || env.assignmentUrl),
      studentDisplayNameConfigured: Boolean(env.studentDisplayName),
      readyTimeoutMs: env.readyTimeoutMs,
      apiTokenConfigured: Boolean(env.apiToken),
      headless: env.headless,
      traceOnFailure: env.traceOnFailure,
      videoOnFailure: env.videoOnFailure
    }
  };
}
