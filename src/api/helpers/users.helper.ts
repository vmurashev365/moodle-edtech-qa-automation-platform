import { pendingImplementation } from '../../utils/assertions';
import type { MoodleClient } from '../clients/MoodleClient';
import type { MoodleUser } from '../models/moodle.types';

export class UsersHelper {
  constructor(private readonly client: MoodleClient) {}

  async findByUsername(username: string): Promise<MoodleUser> {
    void this.client;
    void username;
    pendingImplementation('Moodle user lookup helper. Function name to be confirmed against configured Web Services.');
  }
}
