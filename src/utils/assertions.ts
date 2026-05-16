import assert from 'node:assert/strict';

export function assertTrue(value: unknown, message: string): asserts value {
  assert.ok(value, message);
}

export function assertEquals<T>(actual: T, expected: T, message?: string): void {
  assert.equal(actual, expected, message);
}

export function assertIncludes(actual: string, expected: string, message?: string): void {
  assert.ok(actual.includes(expected), message ?? `Expected "${actual}" to include "${expected}".`);
}

export function pendingImplementation(scope: string): never {
  throw new Error(`Pending implementation: ${scope}`);
}
