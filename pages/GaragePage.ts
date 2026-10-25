import type { Locator, Page } from '@playwright/test';

export class GaragePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addCarButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Garage' });
    this.addCarButton = page.getByRole('button', { name: 'Add car' });
  }

  carEntries(name: string): Locator {
    return this.page.getByRole('listitem').filter({ hasText: name });
  }

  async openAddCarForm() {
    await this.addCarButton.click();
  }
}
