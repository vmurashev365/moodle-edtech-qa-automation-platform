import { When } from '@cucumber/cucumber';
import { pendingImplementation } from '../../utils/assertions';

When('I select Moodle action {string}', async function (actionName: string) {
  void actionName;
  pendingImplementation('controlled Moodle action locators not verified yet.');
});

When('I enter {string} into Moodle field {string}', async function (value: string, fieldName: string) {
  void value;
  void fieldName;
  pendingImplementation('controlled Moodle form field locators not verified yet.');
});
