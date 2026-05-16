import { pendingImplementation } from '../../utils/assertions';
import type { MoodleClient } from '../clients/MoodleClient';
import type { MoodleCourse } from '../models/moodle.types';

export class CoursesHelper {
  constructor(private readonly client: MoodleClient) {}

  async findByName(courseName: string): Promise<MoodleCourse> {
    void this.client;
    void courseName;
    pendingImplementation('Moodle course lookup helper. Function name to be confirmed against configured Web Services.');
  }
}
