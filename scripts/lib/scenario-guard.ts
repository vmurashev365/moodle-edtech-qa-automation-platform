import { loadConfiguration, loadSources } from '@cucumber/cucumber/api';

export interface ScenarioSelection {
  tagExpression: string;
  selected: number;
  selectedIfNotWip: number;
}

// A tag no scenario carries. Substituting it for @wip evaluates the suite's tag expression as if
// no scenario were tagged @wip, which tells "nothing matches" apart from "everything is @wip".
const wipPlaceholderTag = '@scenario-guard-ignores-wip';

function splitProfiles(cucumberArgs: string[]): { profiles: string[]; provided: string[] } {
  const profiles: string[] = [];
  const provided: string[] = [];

  for (let index = 0; index < cucumberArgs.length; index += 1) {
    const arg = cucumberArgs[index];

    if (arg === '--profile' || arg === '-p') {
      profiles.push(cucumberArgs[index + 1]);
      index += 1;
    } else if (arg.startsWith('--profile=')) {
      profiles.push(arg.slice('--profile='.length));
    } else {
      provided.push(arg);
    }
  }

  return { profiles, provided };
}

export async function inspectScenarioSelection(cucumberArgs: string[]): Promise<ScenarioSelection> {
  const { profiles, provided } = splitProfiles(cucumberArgs);
  const { useConfiguration, runConfiguration } = await loadConfiguration({ profiles, provided });
  const tagExpression = useConfiguration.tags;
  const selection = await loadSources(runConfiguration.sources);
  const selectionIfNotWip = await loadSources({
    ...runConfiguration.sources,
    tagExpression: tagExpression.replace(/@wip\b/g, wipPlaceholderTag)
  });
  const errors = [...selection.errors, ...selectionIfNotWip.errors];

  if (errors.length > 0) {
    throw new Error(`Cucumber could not load feature files: ${errors.map((error) => error.message).join('; ')}`);
  }

  return {
    tagExpression,
    selected: selection.plan.length,
    selectedIfNotWip: selectionIfNotWip.plan.length
  };
}

export function emptySelectionMessage(label: string, selection: ScenarioSelection): string {
  const reason =
    selection.selectedIfNotWip > 0
      ? `All ${selection.selectedIfNotWip} scenario(s) matching this suite are tagged @wip; implement them and remove @wip, or run them deliberately with npm run test:wip.`
      : 'No scenario matches this tag expression.';

  return [
    `${label} selected 0 executable Cucumber scenarios for tag expression "${selection.tagExpression}".`,
    reason,
    'Failing intentionally to prevent a false-green command.'
  ].join(' ');
}
