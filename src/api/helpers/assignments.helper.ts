import { pendingImplementation } from '../../utils/assertions';
import type { MoodleClient } from '../clients/MoodleClient';
import type { MoodleAssignment } from '../models/moodle.types';

export class AssignmentsHelper {
  constructor(private readonly client: MoodleClient) {}

  async findByCourseAndName(courseName: string, assignmentName: string): Promise<MoodleAssignment> {
    void this.client;
    void courseName;
    void assignmentName;
    pendingImplementation('Moodle assignment helper. Function name to be confirmed against configured Web Services.');
  }
}
