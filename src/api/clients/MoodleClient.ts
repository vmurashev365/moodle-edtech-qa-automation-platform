import type { TestEnv } from '../../support/env';
import { isApiTokenConfigured, validateEnvContract } from '../../support/env';
import type {
  MoodleWebServiceException,
  MoodleWebServiceRequest,
  MoodleWebServiceResponse
} from '../models/moodle.types';

const responseSnippetLength = 200;

export class MoodleClient {
  constructor(private readonly env: TestEnv) {}

  validateConfiguration() {
    return validateEnvContract(this.env);
  }

  get baseUrl(): string {
    return this.env.baseUrl;
  }

  get apiTokenConfigured(): boolean {
    return isApiTokenConfigured(this.env.apiToken);
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

    const rawBody = await response.text();
    const context = `Moodle Web Service ${request.functionName}`;

    if (!response.ok) {
      throw new Error(this.redactToken(`${context} failed with HTTP ${response.status}: ${this.snippet(rawBody)}`));
    }

    let data: unknown;

    try {
      data = JSON.parse(rawBody);
    } catch {
      const contentType = response.headers.get('content-type') ?? 'unknown content type';
      throw new Error(
        this.redactToken(
          `${context} returned a non-JSON response (HTTP ${response.status}, ${contentType}): ${this.snippet(rawBody)}`
        )
      );
    }

    // Moodle reports Web Service failures with HTTP 200 and an exception object in the body.
    if (isMoodleWebServiceException(data)) {
      const debugInfo = data.debuginfo ? ` (${data.debuginfo})` : '';
      throw new Error(
        this.redactToken(
          `${context} failed with Moodle errorcode "${data.errorcode}": ${data.message ?? ''}${debugInfo}`
        )
      );
    }

    return {
      status: response.status,
      data: data as T
    };
  }

  private snippet(body: string): string {
    const compact = body.replace(/\s+/g, ' ').trim();
    return compact.length > responseSnippetLength
      ? `${compact.slice(0, responseSnippetLength)}...`
      : compact || '<empty body>';
  }

  private redactToken(message: string): string {
    return message.split(this.env.apiToken).join('<redacted-token>');
  }
}

function isMoodleWebServiceException(data: unknown): data is MoodleWebServiceException {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const candidate = data as Record<string, unknown>;
  return typeof candidate.exception === 'string' && typeof candidate.errorcode === 'string';
}
