// Strict environment value parsing. Unset or blank means "use the default" (undefined here);
// a value that is set but invalid throws an error naming the variable instead of falling back.

const trueValues = ['1', 'true', 'yes', 'on'];
const falseValues = ['0', 'false', 'no', 'off'];

export function cleanEnvValue(value: string | undefined): string | undefined {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

export function readIntegerEnv(
  env: NodeJS.ProcessEnv,
  name: string,
  range: { min: number; max?: number }
): number | undefined {
  const raw = cleanEnvValue(env[name]);

  if (raw === undefined) {
    return undefined;
  }

  const parsed = /^-?\d+$/.test(raw) ? Number(raw) : Number.NaN;
  const inRange = parsed >= range.min && (range.max === undefined || parsed <= range.max);

  if (!Number.isSafeInteger(parsed) || !inRange) {
    const expected =
      range.max === undefined ? `an integer >= ${range.min}` : `an integer from ${range.min} to ${range.max}`;
    throw new Error(`${name} must be ${expected}; received "${raw}".`);
  }

  return parsed;
}

export function readBooleanEnv(env: NodeJS.ProcessEnv, name: string): boolean | undefined {
  const raw = cleanEnvValue(env[name]);

  if (raw === undefined) {
    return undefined;
  }

  if (trueValues.includes(raw.toLowerCase())) {
    return true;
  }

  if (falseValues.includes(raw.toLowerCase())) {
    return false;
  }

  throw new Error(`${name} must be one of ${[...trueValues, ...falseValues].join(', ')}; received "${raw}".`);
}

export function readChoiceEnv<T extends string>(
  env: NodeJS.ProcessEnv,
  name: string,
  choices: readonly T[],
  aliases: Record<string, T> = {}
): T | undefined {
  const raw = cleanEnvValue(env[name]);

  if (raw === undefined) {
    return undefined;
  }

  const value = raw.toLowerCase();
  const choice = choices.find((candidate) => candidate === value) ?? aliases[value];

  if (choice === undefined) {
    const accepted = [...choices, ...Object.keys(aliases)].map((candidate) => `"${candidate}"`).join(', ');
    throw new Error(`${name} must be one of ${accepted}; received "${raw}".`);
  }

  return choice;
}
