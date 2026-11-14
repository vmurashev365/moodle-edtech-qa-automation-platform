import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  compareGradingPageRefusal,
  compareGradingRequestRefusal,
  readGradingRequestResult,
  refusedGradingRequestError,
  type GradingPageRefusalObservation
} from '../../../src/domain/access-comparison';
import type { ComparisonRecord } from '../../../src/domain/comparison';

function failedFields(record: ComparisonRecord): string[] {
  return record.checks.filter((check) => check.status === 'MISMATCH').map((check) => check.field);
}

describe('compareGradingPageRefusal', () => {
  const refused: GradingPageRefusalObservation = {
    httpStatus: 404,
    onLoginPage: false,
    signedInUserName: 'Student QA',
    errorMessage: 'error/nopermission',
    errorDocumentationHref: 'https://docs.moodle.org/500/en/error/moodle/nopermission',
    gradeInputCount: 0,
    saveButtonCount: 0
  };

  it('passes for a signed-in student shown the permission error without grading controls', () => {
    assert.equal(compareGradingPageRefusal(refused, 'Student QA').verdict, 'PASS');
  });

  it('does not accept a redirect to the login page as a refusal', () => {
    const record = compareGradingPageRefusal(
      { ...refused, httpStatus: 200, onLoginPage: true, signedInUserName: null, errorMessage: null },
      'Student QA'
    );

    assert.deepEqual(failedFields(record), ['signed-in user', 'page reached', 'HTTP status', 'Moodle error']);
  });

  it('does not accept the refusal of a different signed-in user', () => {
    assert.deepEqual(
      failedFields(compareGradingPageRefusal({ ...refused, signedInUserName: 'Teacher QA' }, 'Student QA')),
      ['signed-in user']
    );
  });

  it('fails when the page opened and offers grading controls', () => {
    const record = compareGradingPageRefusal(
      {
        ...refused,
        httpStatus: 200,
        errorMessage: null,
        errorDocumentationHref: null,
        gradeInputCount: 1,
        saveButtonCount: 1
      },
      'Student QA'
    );

    assert.deepEqual(failedFields(record), [
      'HTTP status',
      'Moodle error',
      'error documentation link',
      'grade input',
      'Save changes button'
    ]);
  });

  it('fails for another Moodle error', () => {
    const record = compareGradingPageRefusal(
      {
        ...refused,
        errorMessage: 'Invalid course module ID',
        errorDocumentationHref: 'https://docs.moodle.org/500/en/error/moodle/invalidcoursemodule'
      },
      'Student QA'
    );

    assert.deepEqual(failedFields(record), ['Moodle error', 'error documentation link']);
  });
});

describe('compareGradingRequestRefusal', () => {
  const permissionError = {
    httpStatus: 200,
    body: [{ error: true, exception: { ...refusedGradingRequestError, link: 'http://127.0.0.1:8080/' } }]
  };

  it('passes for the permission error of the grading capability', () => {
    assert.equal(compareGradingRequestRefusal(permissionError).verdict, 'PASS');
  });

  it('fails when Moodle accepted the grade', () => {
    const record = compareGradingRequestRefusal({ httpStatus: 200, body: [{ error: false, data: [] }] });

    assert.deepEqual(failedFields(record), ['outcome', 'error code', 'error message']);
    assert.equal(record.checks.find((check) => check.field === 'outcome')?.actual, 'accepted');
  });

  it('fails for form-validation warnings, which mean the capability check never ran', () => {
    const response = { httpStatus: 200, body: [{ error: false, data: [{ warningcode: 'couldnotsavegrade' }] }] };
    const record = compareGradingRequestRefusal(response);

    assert.equal(record.checks.find((check) => check.field === 'outcome')?.actual, 'form-validation warnings');
    assert.equal(record.verdict, 'FAIL');
    assert.equal(readGradingRequestResult(response).warningCount, 1);
  });

  it('fails for an error that is not the grading permission error', () => {
    const otherCode = compareGradingRequestRefusal({
      httpStatus: 200,
      body: [{ error: true, exception: { errorcode: 'invalidrecord', message: 'Cannot find the record.' } }]
    });
    const otherCapability = compareGradingRequestRefusal({
      httpStatus: 200,
      body: [
        {
          error: true,
          exception: {
            errorcode: 'nopermissions',
            message: 'Sorry, but you do not currently have permissions to do that (View grades).'
          }
        }
      ]
    });

    assert.deepEqual(failedFields(otherCode), ['error code', 'error message']);
    assert.deepEqual(failedFields(otherCapability), ['error message']);
  });

  it('fails when the response is not one AJAX result with HTTP 200', () => {
    assert.deepEqual(failedFields(compareGradingRequestRefusal({ ...permissionError, httpStatus: 403 })), [
      'HTTP status'
    ]);
    assert.deepEqual(
      failedFields(
        compareGradingRequestRefusal({ httpStatus: 200, body: [...permissionError.body, ...permissionError.body] })
      ),
      ['results in the response']
    );
    assert.deepEqual(failedFields(compareGradingRequestRefusal({ httpStatus: 200, body: '<html>login</html>' })), [
      'results in the response',
      'outcome',
      'error code',
      'error message'
    ]);
  });
});
