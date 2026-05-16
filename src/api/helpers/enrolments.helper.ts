import { pendingImplementation } from '../../utils/assertions';
import type { MoodleClient } from '../clients/MoodleClient';

export class EnrolmentsHelper {
  constructor(private readonly client: MoodleClient) {}

  async verifyUserEnrolled(username: string, courseName: string): Promise<void> {
    void this.client;
    void username;
    void courseName;
    pendingImplementation('Moodle enrolment helper. Function name to be confirmed against configured Web Services.');
  }
}
