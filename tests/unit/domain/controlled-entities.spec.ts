import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildEntityRegistry } from '../../../src/domain/controlled-entities';

function seedArtifact() {
  return {
    baseUrl: 'http://127.0.0.1:8080',
    users: {
      teacher: { id: 3, username: 'teacher.qa', displayName: 'Teacher QA', email: 'teacher.qa@example.test' },
      student: { id: 4, username: 'student.qa', displayName: 'Student QA', email: 'student.qa@example.test' }
    },
    course: { id: 2, fullName: 'QA Automation Demo 101', url: 'http://127.0.0.1:8080/course/view.php?id=2' },
    assignment: {
      instanceId: 1,
      cmid: 7,
      name: 'Essay: Test Automation Strategy',
      url: 'http://127.0.0.1:8080/mod/assign/view.php?id=7',
      maxGrade: 100
    },
    submission: { id: 1, status: 'submitted', text: 'The submitted essay text.' },
    gradebook: { url: 'http://127.0.0.1:8080/grade/report/grader/index.php?id=2', gradeItemId: 5 }
  };
}

describe('buildEntityRegistry', () => {
  it('resolves the names a scenario uses to the seeded records', () => {
    const registry = buildEntityRegistry(seedArtifact());

    assert.deepEqual(registry.teacher('teacher.qa'), {
      role: 'teacher',
      id: 3,
      username: 'teacher.qa',
      displayName: 'Teacher QA',
      email: 'teacher.qa@example.test'
    });
    assert.equal(registry.student('student.qa').id, 4);
    assert.deepEqual(registry.course('QA Automation Demo 101'), {
      id: 2,
      fullName: 'QA Automation Demo 101',
      url: 'http://127.0.0.1:8080/course/view.php?id=2',
      gradebookUrl: 'http://127.0.0.1:8080/grade/report/grader/index.php?id=2'
    });

    const assignment = registry.assignment('Essay: Test Automation Strategy');

    assert.equal(assignment.cmid, 7);
    assert.equal(assignment.instanceId, 1);
    assert.equal(assignment.gradeItemId, 5);
    assert.equal(assignment.maxGrade, 100);
    assert.equal(assignment.course.id, 2);
  });

  it('builds the single-user grading URL for a student and an assignment', () => {
    const registry = buildEntityRegistry(seedArtifact());
    const url = registry.gradingUrl(
      registry.assignment('Essay: Test Automation Strategy'),
      registry.student('student.qa')
    );

    assert.equal(url, 'http://127.0.0.1:8080/mod/assign/view.php?id=7&action=grader&userid=4');
  });

  it('knows the work the student handed in for the assignment, and only that', () => {
    const registry = buildEntityRegistry(seedArtifact());
    const assignment = registry.assignment('Essay: Test Automation Strategy');

    assert.deepEqual(registry.submission(assignment, registry.student('student.qa')), {
      assignmentCmid: 7,
      studentId: 4,
      text: 'The submitted essay text.'
    });
    assert.throws(
      () => registry.submission(assignment, registry.teacher('teacher.qa')),
      /no submission from student "teacher\.qa" for assignment "Essay: Test Automation Strategy"/
    );
  });

  it('names the known entities when a scenario uses an unknown name', () => {
    const registry = buildEntityRegistry(seedArtifact());

    assert.throws(() => registry.student('nobody.qa'), /no student "nobody\.qa".*Known students: "student\.qa"/);
    assert.throws(() => registry.course('Other course'), /no course "Other course".*"QA Automation Demo 101"/);
    assert.throws(() => registry.assignment('Quiz 1'), /no assignment "Quiz 1".*"Essay: Test Automation Strategy"/);
  });

  it('does not let a student stand in for a teacher or the reverse', () => {
    const registry = buildEntityRegistry(seedArtifact());

    assert.throws(
      () => registry.teacher('student.qa'),
      /no teacher "student\.qa"\. "student\.qa" is seeded as a student/
    );
    assert.throws(
      () => registry.student('teacher.qa'),
      /no student "teacher\.qa"\. "teacher\.qa" is seeded as a teacher/
    );
  });

  it('matches names exactly', () => {
    const registry = buildEntityRegistry(seedArtifact());

    assert.throws(() => registry.student('Student.QA'), /no student/);
    assert.throws(() => registry.course('QA Automation Demo 10'), /no course/);
  });

  it('rejects an artifact that lacks what the registry needs, naming the missing value', () => {
    const withoutStudent = seedArtifact() as Record<string, unknown>;
    withoutStudent.users = { teacher: seedArtifact().users.teacher };

    const withTextId = seedArtifact();
    (withTextId.assignment as Record<string, unknown>).cmid = '7';

    const withoutGradeItem = seedArtifact() as Record<string, unknown>;
    withoutGradeItem.gradebook = { url: seedArtifact().gradebook.url };

    assert.throws(() => buildEntityRegistry(withoutStudent), /no "users\.student" section/);
    assert.throws(() => buildEntityRegistry(withTextId), /no positive integer "assignment\.cmid"; found "7"/);
    assert.throws(() => buildEntityRegistry(withoutGradeItem), /no positive integer "gradebook\.gradeItemId"/);
    const withoutSubmissionText = seedArtifact() as Record<string, unknown>;
    withoutSubmissionText.submission = { id: 1 };

    assert.throws(() => buildEntityRegistry(withoutSubmissionText), /no "submission\.text" value/);
    assert.throws(() => buildEntityRegistry(null), /not a JSON object/);
    assert.throws(() => buildEntityRegistry([]), /not a JSON object/);
  });
});
