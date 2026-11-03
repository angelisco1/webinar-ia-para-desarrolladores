import { test, expect } from '@playwright/test';
import { getFirstRestaurantId } from './helpers/restaurant';
import { runAxe } from './helpers/axe';

let restaurantId: string;

test.beforeEach(async ({ request }) => {
  restaurantId = await getFirstRestaurantId(request);
});

const routes: Array<[string, (id: string) => string]> = [
  ['/dashboard', () => '/dashboard'],
  ['/restaurants', () => '/restaurants'],
  ['/restaurants/:id/dashboard', (id) => `/restaurants/${id}/dashboard`],
  ['/restaurants/:id/ingredients', (id) => `/restaurants/${id}/ingredients`],
  ['/restaurants/:id/employees', (id) => `/restaurants/${id}/employees`],
];

for (const [name, path] of routes) {
  test(`contraste de texto en ${name}`, async ({ page }) => {
    await page.goto(path(restaurantId));
    await page.waitForLoadState('networkidle');
    const results = await runAxe(page, { rules: ['color-contrast'] });
    expect(results.violations.map((v) => v.nodes.map((n) => n.target.join(' ')))).toEqual([]);
  });
}

test.describe('login sin sesión', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('contraste de texto en /login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const results = await runAxe(page, { rules: ['color-contrast'] });
    expect(results.violations.map((v) => v.nodes.map((n) => n.target.join(' ')))).toEqual([]);
  });
});
