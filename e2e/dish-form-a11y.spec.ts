import { test, expect, type Locator, type Page } from '@playwright/test';
import { getFirstRestaurantId } from './helpers/restaurant';

let restaurantId: string;

test.beforeEach(async ({ request }) => {
  restaurantId = await getFirstRestaurantId(request);
});

test('carga /dishes/new con sesión', async ({ page }) => {
  await page.goto(`/restaurants/${restaurantId}/dishes/new`);
  await expect(page.locator('#dish-name')).toBeVisible();
});

test.describe('foco visible (2.4.7)', () => {
  /** Pulsa Tab hasta que el elemento recibe el foco (máx. 30 pulsaciones). */
  async function tabTo(page: Page, target: Locator) {
    for (let i = 0; i < 30; i++) {
      if (await target.evaluate((el) => el === document.activeElement)) return;
      await page.keyboard.press('Tab');
    }
    await expect(target).toBeFocused();
  }

  async function focusRing(target: Locator) {
    return target.evaluate((el) => {
      const parse = (c: string) => (c.match(/[\d.]+/g) || []).map(Number);
      const lum = (rgb: number[]) => {
        const [r, g, b] = rgb.slice(0, 3).map((v) => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const s = getComputedStyle(el);
      let parent = el.parentElement;
      let bg = [0, 0, 0, 0];
      while (parent) {
        bg = parse(getComputedStyle(parent).backgroundColor);
        if (bg.length < 4 || bg[3] > 0) break;
        parent = parent.parentElement;
      }
      const a = lum(parse(s.outlineColor));
      const b = lum(bg);
      const [hi, lo] = a > b ? [a, b] : [b, a];
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth), ratio: (hi + 0.05) / (lo + 0.05) };
    });
  }

  test('nombre y Cancelar muestran un contorno visible con contraste >= 3:1', async ({ page }) => {
    await page.goto(`/restaurants/${restaurantId}/dishes/new`);
    for (const target of [page.locator('#dish-name'), page.getByRole('link', { name: 'Cancelar' })]) {
      await tabTo(page, target);
      const ring = await focusRing(target);
      expect(ring.style).toBe('solid');
      expect(ring.width).toBeGreaterThanOrEqual(2);
      expect(ring.ratio).toBeGreaterThanOrEqual(3);
    }
  });
});
