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
  ['/restaurants/:id/dishes', (id) => `/restaurants/${id}/dishes`],
  ['/restaurants/:id/dishes/new', (id) => `/restaurants/${id}/dishes/new`],
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

test('contraste de texto en dishes/new con el toast de error visible', async ({ page }) => {
  await page.goto(`/restaurants/${restaurantId}/dishes/new`);
  await page.getByText('Guardar', { exact: true }).click();
  await expect(page.locator('.toast-error')).toBeVisible();
  const results = await runAxe(page, { rules: ['color-contrast'] });
  expect(results.violations.map((v) => v.nodes.map((n) => n.target.join(' ')))).toEqual([]);
});

test('el placeholder de dishes/new tiene contraste >= 4,5:1', async ({ page }) => {
  await page.goto(`/restaurants/${restaurantId}/dishes/new`);
  const ratios = await page.evaluate(() => {
    const lum = (rgb: number[]) => {
      const [r, g, b] = rgb.map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const parse = (c: string) => (c.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    return Array.from(document.querySelectorAll('input[placeholder], textarea[placeholder]')).map((el) => {
      const fg = lum(parse(getComputedStyle(el, '::placeholder').color));
      const bg = lum(parse(getComputedStyle(el).backgroundColor));
      const [a, b] = fg > bg ? [fg, bg] : [bg, fg];
      return (a + 0.05) / (b + 0.05);
    });
  });
  expect(ratios.length).toBeGreaterThan(0);
  for (const r of ratios) expect(r).toBeGreaterThanOrEqual(4.5);
});
