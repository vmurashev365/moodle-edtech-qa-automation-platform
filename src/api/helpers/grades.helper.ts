import { pendingImplementation } from '../../utils/assertions';
import type { MoodleClient } from '../clients/MoodleClient';
import type { MoodleGrade } from '../models/moodle.types';

export class GradesHelper {
  constructor(private readonly client: MoodleClient) {}

  async readAssignmentGrade(username: string, assignmentName: string): Promise<MoodleGrade> {
    void this.client;
    void username;
    void assignmentName;
    pendingImplementation('Moodle gradebook helper. Function name to be confirmed against configured Web Services.');
  }
}
