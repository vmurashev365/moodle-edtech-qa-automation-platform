import { buildComparison, type ComparisonRecord } from './comparison';

// How Moodle 5.0 refuses a user who may not grade, on the two routes a grade can be written.

// core_renderer::fatal_error sends 404 for an error raised before page output when the request carries no Range
// header, which is the case for the capability check at the top of the grading page.
export const refusedGradingPageStatus = 404;

// view_grader() calls assign::require_view_grades(), which throws required_capability_exception with errorcode
// "nopermission" unless the user has mod/assign:viewgrades or mod/assign:grade. Moodle 5.0.1 has no language
// string for that errorcode, so the page prints "error/nopermission" and does not name the capability.
export const refusedGradingPageError = {
  message: 'error/nopermission',
  documentationPath: '/error/moodle/nopermission'
};

// mod_assign_submit_grading_form validates the grade form first and calls assign::save_grade() only for valid data;
// save_grade() starts with require_capability('mod/assign:grade'), whose English name is "Grade assignment". A
// malformed request fails differently (a "couldnotsavegrade" warning or another errorcode), so only this exact error
// proves the permission boundary.
export const refusedGradingRequestError = {
  errorcode: 'nopermissions',
  message: 'Sorry, but you do not currently have permissions to do that (Grade assignment).'
};

export interface GradingPageRefusalObservation {
  httpStatus: number;
  onLoginPage: boolean;
  // null: the page shows no user menu, or it names nobody.
  signedInUserName: string | null;
  errorMessage: string | null;
  errorDocumentationHref: string | null;
  gradeInputCount: number;
  saveButtonCount: number;
}

export interface GradingRequestResponse {
  httpStatus: number;
  body: unknown;
}

// One call sent through lib/ajax/service.php comes back as a one-element array.
export interface GradingRequestResult {
  resultCount: number | null;
  errorReported: boolean;
  // Form-validation warnings: the grade form did not validate, so the capability check never ran.
  warningCount: number;
  errorcode: string | null;
  message: string | null;
}

const gradingPageSource = 'Single-user grading page (browser)';
const responseSource = "Response of Moodle's grading service (mod_assign_submit_grading_form)";

function absentOrPresent(count: number): string {
  return count === 0 ? 'absent' : `present (${count})`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function readGradingRequestResult(response: GradingRequestResponse): GradingRequestResult {
  const results = Array.isArray(response.body) ? (response.body as unknown[]) : null;
  const first = results && isRecord(results[0]) ? results[0] : {};
  const exception = isRecord(first.exception) ? first.exception : {};

  return {
    resultCount: results ? results.length : null,
    errorReported: first.error === true,
    warningCount: Array.isArray(first.data) ? first.data.length : 0,
    errorcode: textOrNull(exception.errorcode),
    message: textOrNull(exception.message)
  };
}

export function compareGradingPageRefusal(
  observation: GradingPageRefusalObservation,
  expectedUserName: string,
  comparedAt?: Date
): ComparisonRecord {
  return buildComparison({
    evidenceType: 'grading-page-refusal',
    rule: 'A signed-in user who may not grade is refused the grading page and gets no grading controls.',
    comparedAt,
    checks: [
      {
        // A signed-out or different user also lacks grading controls, so identity comes first.
        field: 'signed-in user',
        source: 'User menu (browser)',
        expected: expectedUserName,
        actual: observation.signedInUserName
      },
      {
        field: 'page reached',
        source: 'Browser address',
        expected: 'the grading page, not the login page',
        actual: observation.onLoginPage ? 'the login page' : 'the grading page, not the login page'
      },
      {
        field: 'HTTP status',
        source: 'Response to opening the grading page',
        expected: String(refusedGradingPageStatus),
        actual: String(observation.httpStatus)
      },
      {
        field: 'Moodle error',
        source: gradingPageSource,
        expected: refusedGradingPageError.message,
        actual: observation.errorMessage
      },
      {
        field: 'error documentation link',
        source: gradingPageSource,
        match: 'contains',
        expected: refusedGradingPageError.documentationPath,
        actual: observation.errorDocumentationHref
      },
      {
        field: 'grade input',
        source: gradingPageSource,
        expected: 'absent',
        actual: absentOrPresent(observation.gradeInputCount)
      },
      {
        field: 'Save changes button',
        source: gradingPageSource,
        expected: 'absent',
        actual: absentOrPresent(observation.saveButtonCount)
      }
    ]
  });
}

export function compareGradingRequestRefusal(response: GradingRequestResponse, comparedAt?: Date): ComparisonRecord {
  const result = readGradingRequestResult(response);

  return buildComparison({
    evidenceType: 'grading-request-refusal',
    rule: 'A grading request from a user without permission to grade is refused for that reason.',
    comparedAt,
    checks: [
      {
        field: 'HTTP status',
        source: responseSource,
        expected: '200',
        actual: String(response.httpStatus)
      },
      {
        field: 'results in the response',
        source: responseSource,
        expected: '1',
        actual: result.resultCount === null ? null : String(result.resultCount)
      },
      {
        field: 'outcome',
        source: responseSource,
        expected: 'error',
        actual: result.errorReported ? 'error' : result.warningCount > 0 ? 'form-validation warnings' : 'accepted'
      },
      {
        field: 'error code',
        source: responseSource,
        expected: refusedGradingRequestError.errorcode,
        actual: result.errorcode
      },
      {
        field: 'error message',
        source: responseSource,
        expected: refusedGradingRequestError.message,
        actual: result.message
      }
    ]
  });
}
