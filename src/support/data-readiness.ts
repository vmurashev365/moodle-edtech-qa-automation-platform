import type { TestEnv } from './env';
import { loadEnv } from './env';

export interface ControlledDataReadinessResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  summary: Record<string, string | boolean | number>;
}

function hasValue(value: string): boolean {
  return value.trim().length > 0;
}

function makeUrl(path: string, env: TestEnv): string {
  return new URL(path, env.baseUrl).toString();
}

export function resolveCourseUrl(env: TestEnv = loadEnv()): string | undefined {
  if (hasValue(env.courseUrl)) {
    return env.courseUrl;
  }

  if (hasValue(env.courseId)) {
    return makeUrl(`/course/view.php?id=${encodeURIComponent(env.courseId)}`, env);
  }

  return undefined;
}

export function resolveAssignmentUrl(env: TestEnv = loadEnv()): string | undefined {
  if (hasValue(env.assignmentUrl)) {
    return env.assignmentUrl;
  }

  if (hasValue(env.assignmentId)) {
    return makeUrl(`/mod/assign/view.php?id=${encodeURIComponent(env.assignmentId)}`, env);
  }

  return undefined;
}

export function resolveAssignmentSubmissionsUrl(env: TestEnv = loadEnv()): string | undefined {
  if (hasValue(env.assignmentSubmissionsUrl)) {
    return env.assignmentSubmissionsUrl;
  }

  const assignmentUrl = resolveAssignmentUrl(env);

  if (!assignmentUrl) {
    return undefined;
  }

  const url = new URL(assignmentUrl, env.baseUrl);
  url.searchParams.set('action', 'grading');
  return url.toString();
}

function courseIdFromUrl(env: TestEnv): string | undefined {
  if (!hasValue(env.courseUrl)) {
    return undefined;
  }

  try {
    const url = new URL(env.courseUrl, env.baseUrl);
    return url.searchParams.get('id') ?? undefined;
  } catch {
    return undefined;
  }
}

export function resolveGradebookUrl(env: TestEnv = loadEnv()): string | undefined {
  if (hasValue(env.gradebookUrl)) {
    return env.gradebookUrl;
  }

  const courseId = hasValue(env.courseId) ? env.courseId : courseIdFromUrl(env);

  if (courseId) {
    return makeUrl(`/grade/report/grader/index.php?id=${encodeURIComponent(courseId)}`, env);
  }

  return undefined;
}

export function studentSubmissionSearchTerms(env: TestEnv = loadEnv()): string[] {
  return [env.studentDisplayName, env.studentUsername, env.studentId].filter(hasValue);
}

export function validateControlledDataReadiness(env: TestEnv = loadEnv()): ControlledDataReadinessResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const courseUrl = resolveCourseUrl(env);
  const assignmentUrl = resolveAssignmentUrl(env);
  const submissionsUrl = resolveAssignmentSubmissionsUrl(env);
  const studentTerms = studentSubmissionSearchTerms(env);

  if (!hasValue(env.teacherUsername)) {
    errors.push('MOODLE_TEACHER_USERNAME is required for the Phase 5 teacher workflow.');
  }

  if (!hasValue(env.teacherPassword)) {
    errors.push('MOODLE_TEACHER_PASSWORD is required for the Phase 5 teacher workflow.');
  }

  if (env.teacherPassword === 'changeme') {
    warnings.push(
      'MOODLE_TEACHER_PASSWORD still uses the placeholder value; update it if the teacher account differs.'
    );
  }

  if (!courseUrl) {
    errors.push('Set MOODLE_COURSE_ID or MOODLE_COURSE_URL after creating QA Automation Demo 101.');
  }

  if (!assignmentUrl) {
    warnings.push(
      'MOODLE_ASSIGNMENT_ID or MOODLE_ASSIGNMENT_URL is not set; the workflow will try to open the assignment by visible name from the course page.'
    );
  }

  if (!submissionsUrl) {
    warnings.push(
      'MOODLE_ASSIGNMENT_SUBMISSIONS_URL is not set; the workflow will try Moodle-visible submissions actions from the assignment page.'
    );
  }

  if (!hasValue(env.studentDisplayName)) {
    errors.push(
      'Set MOODLE_STUDENT_DISPLAY_NAME for Phase 5 UI validation. Moodle submission tables commonly show the full display name, not the username.'
    );
  }

  if (studentTerms.length === 0) {
    errors.push(
      'Set MOODLE_STUDENT_DISPLAY_NAME, MOODLE_STUDENT_USERNAME, or MOODLE_STUDENT_ID for submission visibility.'
    );
  }

  if (!hasValue(env.apiToken)) {
    warnings.push('MOODLE_API_TOKEN is not configured; Phase 5 seed validation is UI/manual only.');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary: {
      baseUrl: env.baseUrl,
      teacherUsername: env.teacherUsername,
      courseName: env.courseName,
      assignmentName: env.assignmentName,
      courseNavigationReady: Boolean(courseUrl),
      assignmentDirectNavigationReady: Boolean(assignmentUrl),
      submissionsDirectNavigationReady: Boolean(submissionsUrl),
      studentDisplayNameConfigured: Boolean(env.studentDisplayName),
      studentSearchTermCount: studentTerms.length,
      apiTokenConfigured: Boolean(env.apiToken)
    }
  };
}

export function validateControlledGradingReadiness(env: TestEnv = loadEnv()): ControlledDataReadinessResult {
  const baseReadiness = validateControlledDataReadiness(env);
  const errors = [...baseReadiness.errors];
  const warnings = [...baseReadiness.warnings];
  const submissionsUrl = resolveAssignmentSubmissionsUrl(env);
  const gradebookUrl = resolveGradebookUrl(env);

  if (!submissionsUrl) {
    errors.push(
      'Set MOODLE_ASSIGNMENT_SUBMISSIONS_URL, MOODLE_ASSIGNMENT_ID, or MOODLE_ASSIGNMENT_URL before running Phase 6 grading.'
    );
  }

  if (!gradebookUrl) {
    errors.push(
      'Set MOODLE_GRADEBOOK_URL, MOODLE_COURSE_ID, or MOODLE_COURSE_URL before running Phase 6 gradebook validation.'
    );
  }

  if (!Number.isFinite(env.targetGrade)) {
    errors.push('MOODLE_TARGET_GRADE must be numeric before running Phase 6 grading.');
  }

  if (!hasValue(env.apiToken)) {
    warnings.push('API-backed grade verification is not configured; Phase 6 remains UI/manual-seed only.');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary: {
      ...baseReadiness.summary,
      submissionsNavigationReady: Boolean(submissionsUrl),
      gradebookNavigationReady: Boolean(gradebookUrl),
      targetGrade: env.targetGrade
    }
  };
}
