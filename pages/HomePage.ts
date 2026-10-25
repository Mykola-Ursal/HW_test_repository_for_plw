import type { Locator, Page } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly guestLoginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.guestLoginButton = page.getByRole('button', { name: 'Guest log in' });
  }

  async open() {
    await this.page.goto('/');
  }

  async loginAsGuest() {
    await this.guestLoginButton.click();
  }
}
