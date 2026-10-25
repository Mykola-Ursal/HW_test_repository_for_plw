import type { Locator, Page } from '@playwright/test';

export class AddCarModal {
  readonly root: Locator;
  readonly brandSelect: Locator;
  readonly modelSelect: Locator;
  readonly mileageInput: Locator;
  readonly addButton: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('dialog');
    this.brandSelect = this.root.getByLabel('Brand');
    this.modelSelect = this.root.getByLabel('Model');
    this.mileageInput = this.root.getByRole('spinbutton', { name: 'Mileage' });
    this.addButton = this.root.getByRole('button', { name: 'Add', exact: true });
  }

  async selectBrand(brand: string) {
    await this.brandSelect.selectOption({ label: brand });
  }

  async selectModel(model: string) {
    await this.modelSelect.selectOption({ label: model });
  }

  async fillMileage(mileage: string) {
    await this.mileageInput.fill(mileage);
  }

  async save() {
    await this.addButton.click();
  }
}
