import type { TestEnv } from '../../support/env';
import { validateEnvContract } from '../../support/env';
import type { MoodleWebServiceRequest, MoodleWebServiceResponse } from '../models/moodle.types';

export class MoodleClient {
  constructor(private readonly env: TestEnv) {}

  validateConfiguration() {
    return validateEnvContract(this.env);
  }

  get baseUrl(): string {
    return this.env.baseUrl;
  }

  get apiTokenConfigured(): boolean {
    return this.env.apiToken.trim().length > 0;
  }

  async callWebService<T>(request: MoodleWebServiceRequest): Promise<MoodleWebServiceResponse<T>> {
    if (!this.apiTokenConfigured) {
      throw new Error('Pending implementation: MOODLE_API_TOKEN is not configured for Moodle Web Service calls.');
    }

    if (!request.functionName.trim()) {
      throw new Error(
        'Pending implementation: Moodle Web Service function name must be confirmed against the configured instance.'
      );
    }

    const endpoint = new URL('/webservice/rest/server.php', this.env.baseUrl);
    const body = new URLSearchParams();
    body.set('wstoken', this.env.apiToken);
    body.set('wsfunction', request.functionName);
    body.set('moodlewsrestformat', 'json');

    for (const [key, value] of Object.entries(request.params ?? {})) {
      if (value !== undefined) {
        body.set(key, String(value));
      }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body
    });

    const data = (await response.json()) as T;

    if (!response.ok) {
      throw new Error(`Moodle Web Service request failed with status ${response.status}.`);
    }

    return {
      status: response.status,
      data
    };
  }
}
