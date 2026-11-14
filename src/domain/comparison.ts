// Comparison evidence: what a step compared with what, and where each value came from. A step builds the
// record, attaches it to the report and then asserts from the same record, so the evidence a reader sees
// under the step and the verdict of the step cannot disagree. Pure functions; no browser, no Cucumber.

export type ComparisonMatch = 'equals' | 'contains';
export type ComparisonStatus = 'MATCH' | 'MISMATCH';
export type ComparisonVerdict = 'PASS' | 'FAIL';

export interface ComparisonInput {
  field: string;
  // Where the actual value was read from, in words a report reader understands.
  source: string;
  expected: string;
  // null means the value could not be read at all; it never matches.
  actual: string | null;
  match?: ComparisonMatch;
}

export interface ComparisonCheck {
  field: string;
  source: string;
  match: ComparisonMatch;
  expected: string;
  actual: string | null;
  status: ComparisonStatus;
}

export interface ComparisonRecord {
  schemaVersion: 1;
  evidenceType: string;
  rule: string;
  verdict: ComparisonVerdict;
  checks: ComparisonCheck[];
  comparedAt: string;
}

// Same normalization as Playwright's toHaveText: trim and collapse whitespace.
export function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function compare(input: ComparisonInput): ComparisonCheck {
  const match = input.match ?? 'equals';
  const expected = normalizeText(input.expected);
  const actual = input.actual === null ? null : normalizeText(input.actual);

  if (expected === '') {
    // "contains an empty string" is always true, and an empty expectation states nothing.
    throw new Error(`Comparison check "${input.field}" has an empty expected value.`);
  }

  const matched = actual !== null && (match === 'equals' ? actual === expected : actual.includes(expected));

  return {
    field: input.field,
    source: input.source,
    match,
    expected,
    actual,
    status: matched ? 'MATCH' : 'MISMATCH'
  };
}

export function buildComparison(input: {
  evidenceType: string;
  rule: string;
  checks: ComparisonInput[];
  comparedAt?: Date;
}): ComparisonRecord {
  if (input.checks.length === 0) {
    // A record without checks would read as PASS while proving nothing.
    throw new Error(`Comparison "${input.evidenceType}" has no checks.`);
  }

  const checks = input.checks.map(compare);

  return {
    schemaVersion: 1,
    evidenceType: input.evidenceType,
    rule: input.rule,
    verdict: checks.every((check) => check.status === 'MATCH') ? 'PASS' : 'FAIL',
    checks,
    comparedAt: (input.comparedAt ?? new Date()).toISOString()
  };
}

export function comparisonMismatches(record: ComparisonRecord): string[] {
  return record.checks
    .filter((check) => check.status === 'MISMATCH')
    .map((check) => {
      const expectation = check.match === 'contains' ? `to contain "${check.expected}"` : `"${check.expected}"`;
      const actual = check.actual === null ? 'nothing (the value could not be read)' : `"${check.actual}"`;

      return `${check.field} (${check.source}): expected ${expectation}, got ${actual}`;
    });
}

export function assertComparison(record: ComparisonRecord): void {
  const mismatches = comparisonMismatches(record);

  if (record.verdict === 'PASS' && mismatches.length === 0) {
    return;
  }

  throw new Error([`Rule not met: ${record.rule}`, ...mismatches].join('\n'));
}
