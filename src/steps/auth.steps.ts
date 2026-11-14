import { Given, Then, When } from '@cucumber/cucumber';
import type { UserEntity } from '../domain/controlled-entities';
import { LoginPage } from '../pages/auth/LoginPage';
import type { MoodleWorld } from '../support/custom-world';

// Signs the seeded user in through the login form and requires the user menu to belong to that user. The
// password is not seeded data: it comes from the environment.
async function signIn(world: MoodleWorld, user: UserEntity, password: string): Promise<void> {
  const loginPage = new LoginPage(world.requirePage());

  await loginPage.login(user.username, password);
  await loginPage.expectSignedInAs(user.displayName);
  world.signedIn = user;
}

Given('teacher {string} is signed in', async function (this: MoodleWorld, username: string) {
  await signIn(this, this.entities.teacher(username), this.env.teacherPassword);
});

Given('student {string} is signed in', async function (this: MoodleWorld, username: string) {
  await signIn(this, this.entities.student(username), this.env.studentPassword);
});

When('a visitor opens the login page', async function (this: MoodleWorld) {
  await new LoginPage(this.requirePage()).open();
});

Then('the sign-in form is available', async function (this: MoodleWorld) {
  await new LoginPage(this.requirePage()).expectLoginFormVisible();
});
