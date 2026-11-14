// The controlled Moodle data a scenario may name: users, courses and assignments, resolved from the names
// written in the feature file to the records the seed created. A step looks an entity up by the name in the
// scenario, so a second student or course needs seed data and a scenario, not a new step or new .env keys.
//
// Built from the seed artifact (scripts/seed-controlled-moodle.ts). Pure; reading the file is the caller's job.

export type UserRole = 'teacher' | 'student';

export interface UserEntity {
  role: UserRole;
  id: number;
  username: string;
  displayName: string;
  email: string;
}

export interface CourseEntity {
  id: number;
  fullName: string;
  url: string;
  gradebookUrl: string;
}

export interface AssignmentEntity {
  // Course module id: the "id" of /mod/assign/view.php and of the Moodle CLI scripts.
  cmid: number;
  // The assign instance id, which Moodle's grading service takes instead of the cmid.
  instanceId: number;
  name: string;
  url: string;
  maxGrade: number;
  gradeItemId: number;
  course: CourseEntity;
}

// The work one student handed in for one assignment.
export interface SubmissionEntity {
  assignmentCmid: number;
  studentId: number;
  text: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function section(parent: Record<string, unknown>, key: string, path: string): Record<string, unknown> {
  const value = parent[key];

  if (!isRecord(value)) {
    throw new Error(`The seed artifact has no "${path}" section.`);
  }

  return value;
}

function text(parent: Record<string, unknown>, key: string, path: string): string {
  const value = parent[key];

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`The seed artifact has no "${path}" value.`);
  }

  return value;
}

function positiveInteger(parent: Record<string, unknown>, key: string, path: string): number {
  const value = parent[key];

  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`The seed artifact has no positive integer "${path}"; found ${JSON.stringify(value)}.`);
  }

  return value;
}

function user(users: Record<string, unknown>, role: UserRole): UserEntity {
  const path = `users.${role}`;
  const record = section(users, role, path);

  return {
    role,
    id: positiveInteger(record, 'id', `${path}.id`),
    username: text(record, 'username', `${path}.username`),
    displayName: text(record, 'displayName', `${path}.displayName`),
    email: text(record, 'email', `${path}.email`)
  };
}

function quoted(names: string[]): string {
  return names.length > 0 ? names.map((name) => `"${name}"`).join(', ') : 'none';
}

export class EntityRegistry {
  constructor(
    private readonly users: UserEntity[],
    private readonly courses: CourseEntity[],
    private readonly assignments: AssignmentEntity[],
    private readonly submissions: SubmissionEntity[]
  ) {}

  teacher(username: string): UserEntity {
    return this.user('teacher', username);
  }

  student(username: string): UserEntity {
    return this.user('student', username);
  }

  course(fullName: string): CourseEntity {
    const course = this.courses.find((candidate) => candidate.fullName === fullName);

    if (!course) {
      throw new Error(
        `The controlled Moodle data has no course "${fullName}". ` +
          `Known courses: ${quoted(this.courses.map((candidate) => candidate.fullName))}.`
      );
    }

    return course;
  }

  assignment(name: string): AssignmentEntity {
    const assignment = this.assignments.find((candidate) => candidate.name === name);

    if (!assignment) {
      throw new Error(
        `The controlled Moodle data has no assignment "${name}". ` +
          `Known assignments: ${quoted(this.assignments.map((candidate) => candidate.name))}.`
      );
    }

    return assignment;
  }

  submission(assignment: AssignmentEntity, student: UserEntity): SubmissionEntity {
    const submission = this.submissions.find(
      (candidate) => candidate.assignmentCmid === assignment.cmid && candidate.studentId === student.id
    );

    if (!submission) {
      throw new Error(
        `The controlled Moodle data has no submission from student "${student.username}" for assignment "${assignment.name}".`
      );
    }

    return submission;
  }

  // Moodle's single-user grading interface for one student's submission.
  gradingUrl(assignment: AssignmentEntity, student: UserEntity): string {
    const url = new URL(assignment.url);
    url.searchParams.set('action', 'grader');
    url.searchParams.set('userid', String(student.id));

    return url.toString();
  }

  private user(role: UserRole, username: string): UserEntity {
    const sameRole = this.users.filter((candidate) => candidate.role === role);
    const found = sameRole.find((candidate) => candidate.username === username);

    if (found) {
      return found;
    }

    const otherRole = this.users.find((candidate) => candidate.username === username);
    const hint = otherRole ? ` "${username}" is seeded as a ${otherRole.role}.` : '';

    throw new Error(
      `The controlled Moodle data has no ${role} "${username}".${hint} ` +
        `Known ${role}s: ${quoted(sameRole.map((candidate) => candidate.username))}.`
    );
  }
}

export function buildEntityRegistry(artifact: unknown): EntityRegistry {
  if (!isRecord(artifact)) {
    throw new Error('The seed artifact is not a JSON object.');
  }

  const users = section(artifact, 'users', 'users');
  const courseRecord = section(artifact, 'course', 'course');
  const assignmentRecord = section(artifact, 'assignment', 'assignment');
  const gradebookRecord = section(artifact, 'gradebook', 'gradebook');

  const course: CourseEntity = {
    id: positiveInteger(courseRecord, 'id', 'course.id'),
    fullName: text(courseRecord, 'fullName', 'course.fullName'),
    url: text(courseRecord, 'url', 'course.url'),
    gradebookUrl: text(gradebookRecord, 'url', 'gradebook.url')
  };
  const assignment: AssignmentEntity = {
    cmid: positiveInteger(assignmentRecord, 'cmid', 'assignment.cmid'),
    instanceId: positiveInteger(assignmentRecord, 'instanceId', 'assignment.instanceId'),
    name: text(assignmentRecord, 'name', 'assignment.name'),
    url: text(assignmentRecord, 'url', 'assignment.url'),
    maxGrade: positiveInteger(assignmentRecord, 'maxGrade', 'assignment.maxGrade'),
    gradeItemId: positiveInteger(gradebookRecord, 'gradeItemId', 'gradebook.gradeItemId'),
    course
  };

  const teacher = user(users, 'teacher');
  const student = user(users, 'student');
  // The seed creates one submission: the student's work for the assignment.
  const submission: SubmissionEntity = {
    assignmentCmid: assignment.cmid,
    studentId: student.id,
    text: text(section(artifact, 'submission', 'submission'), 'text', 'submission.text')
  };

  return new EntityRegistry([teacher, student], [course], [assignment], [submission]);
}
