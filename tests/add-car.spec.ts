import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { GaragePage } from '../pages/GaragePage';
import { AddCarModal } from '../pages/AddCarModal';

const BRAND = 'Audi';
const MODEL = 'TT';
const MILEAGE = '12000';
const CAR_NAME = `${BRAND} ${MODEL}`;

test('guest can add Audi TT to Garage', async ({ page }) => {
  const home = new HomePage(page);
  const garage = new GaragePage(page);
  const addCar = new AddCarModal(page);

  await test.step('log in as guest', async () => {
    await home.open();
    await home.loginAsGuest();
    await expect(page).toHaveURL(/panel\/garage/);
    await expect(garage.heading).toBeVisible();
    await expect(garage.carEntries(CAR_NAME)).toHaveCount(0);
  });

  await test.step('fill Add car form', async () => {
    await garage.openAddCarForm();
    await expect(addCar.root).toBeVisible();
    await addCar.selectBrand(BRAND);
    await expect(addCar.modelSelect).toBeEnabled();
    await addCar.selectModel(MODEL);
    await addCar.fillMileage(MILEAGE);
    await expect(addCar.mileageInput).toHaveValue(MILEAGE);
  });

  await test.step('save and see the car in Garage', async () => {
    await addCar.save();
    await expect(addCar.root).toBeHidden();
    await expect(page).toHaveURL(/panel\/garage/);
    await expect(garage.carEntries(CAR_NAME)).toHaveCount(1);
    await expect(garage.carEntries(CAR_NAME)).toBeVisible();
  });
});
