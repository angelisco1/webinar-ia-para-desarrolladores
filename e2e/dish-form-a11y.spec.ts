import { test, expect } from '@playwright/test';
import { getFirstRestaurantId } from './helpers/restaurant';

let restaurantId: string;

test.beforeEach(async ({ request }) => {
  restaurantId = await getFirstRestaurantId(request);
});

test('carga /dishes/new con sesión', async ({ page }) => {
  await page.goto(`/restaurants/${restaurantId}/dishes/new`);
  await expect(page.locator('#dish-name')).toBeVisible();
});
