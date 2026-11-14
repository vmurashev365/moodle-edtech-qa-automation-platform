import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertComparison, buildComparison, comparisonMismatches } from '../../../src/domain/comparison';

const comparedAt = new Date('2026-01-01T00:00:00.000Z');

function record(checks: Parameters<typeof buildComparison>[0]['checks']) {
  return buildComparison({ evidenceType: 'test', rule: 'Values agree.', checks, comparedAt });
}

describe('buildComparison', () => {
  it('passes when every check matches and keeps what was compared', () => {
    const result = record([{ field: 'grade', source: 'page', expected: '82.00', actual: '82.00' }]);

    assert.deepEqual(result, {
      schemaVersion: 1,
      evidenceType: 'test',
      rule: 'Values agree.',
      verdict: 'PASS',
      checks: [
        { field: 'grade', source: 'page', match: 'equals', expected: '82.00', actual: '82.00', status: 'MATCH' }
      ],
      comparedAt: '2026-01-01T00:00:00.000Z'
    });
  });

  it('fails when one of several checks differs', () => {
    const result = record([
      { field: 'name', source: 'page', expected: 'Student QA', actual: 'Student QA' },
      { field: 'grade', source: 'page', expected: '82.00', actual: '182.00' }
    ]);

    assert.equal(result.verdict, 'FAIL');
    assert.deepEqual(
      result.checks.map((check) => check.status),
      ['MATCH', 'MISMATCH']
    );
  });

  it('does not let a longer value satisfy an exact check', () => {
    assert.equal(record([{ field: 'grade', source: 'page', expected: '82.00', actual: '82.001' }]).verdict, 'FAIL');
    assert.equal(record([{ field: 'grade', source: 'page', expected: '82.00', actual: '182.00' }]).verdict, 'FAIL');
  });

  it('ignores surrounding and repeated whitespace, as the page assertions do', () => {
    const result = record([{ field: 'grade', source: 'page', expected: '82.00', actual: '\n   82.00  \n' }]);

    assert.equal(result.verdict, 'PASS');
    assert.equal(result.checks[0].actual, '82.00');
  });

  it('supports containment for text that carries more than the expected value', () => {
    const row = 'Student QA   student.qa@example.test  82.00';

    assert.equal(
      record([{ field: 'email', source: 'page', match: 'contains', expected: 'student.qa@example.test', actual: row }])
        .verdict,
      'PASS'
    );
    assert.equal(
      record([{ field: 'email', source: 'page', match: 'contains', expected: 'other@example.test', actual: row }])
        .verdict,
      'FAIL'
    );
  });

  it('never matches a value that could not be read', () => {
    const result = record([{ field: 'grade', source: 'page', match: 'contains', expected: '82', actual: null }]);

    assert.equal(result.verdict, 'FAIL');
    assert.equal(result.checks[0].actual, null);
  });

  it('refuses a record without checks, which would pass while proving nothing', () => {
    assert.throws(() => record([]), /has no checks/);
  });

  it('refuses an empty expected value, which containment would always satisfy', () => {
    assert.throws(
      () => record([{ field: 'name', source: 'page', match: 'contains', expected: '  ', actual: 'anything' }]),
      /empty expected value/
    );
  });
});

describe('assertComparison', () => {
  it('does not throw for a passing record', () => {
    assert.doesNotThrow(() =>
      assertComparison(record([{ field: 'grade', source: 'page', expected: '1', actual: '1' }]))
    );
  });

  it('names the rule, the field, the source and both values when a check differs', () => {
    const failing = record([
      { field: 'grade cell', source: 'gradebook page', expected: '82.00', actual: '80.00' },
      { field: 'row', source: 'gradebook page', match: 'contains', expected: 'Student QA', actual: null }
    ]);

    assert.deepEqual(comparisonMismatches(failing), [
      'grade cell (gradebook page): expected "82.00", got "80.00"',
      'row (gradebook page): expected to contain "Student QA", got nothing (the value could not be read)'
    ]);
    assert.throws(() => assertComparison(failing), /Rule not met: Values agree\.\ngrade cell \(gradebook page\)/);
  });
});
