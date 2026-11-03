import { test, expect, type Page } from '@playwright/test';
import { getFirstRestaurantId } from './helpers/restaurant';

let restaurantId: string;

test.beforeEach(async ({ page, request }) => {
  restaurantId = await getFirstRestaurantId(request);
  await page.goto(`/restaurants/${restaurantId}/dishes/new`);
  await page.waitForFunction(() => document.getAnimations().length === 0);
  // el campo de nombre recibe el foco al cargar; se desenfoca para medir su borde en reposo
  await expect(page.locator('#dish-name')).toBeFocused();
  await page.locator('#dish-name').blur();
  await page.waitForFunction(() => document.getAnimations().length === 0);
});

/** Contraste entre el borde computado del elemento y el fondo opaco de su contenedor. */
async function borderContrast(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((el) => {
    const parse = (c: string) => (c.match(/[\d.]+/g) || []).map(Number);
    const lum = (rgb: number[]) => {
      const [r, g, b] = rgb.slice(0, 3).map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const style = getComputedStyle(el);
    if (parseFloat(style.borderTopWidth) === 0 || style.borderTopStyle === 'none') return 0;
    let parent = el.parentElement;
    let bg = [0, 0, 0, 0];
    while (parent) {
      bg = parse(getComputedStyle(parent).backgroundColor);
      if (bg.length < 4 || bg[3] > 0) break;
      parent = parent.parentElement;
    }
    const a = lum(parse(style.borderTopColor));
    const b = lum(bg);
    const [hi, lo] = a > b ? [a, b] : [b, a];
    return (hi + 0.05) / (lo + 0.05);
  });
}

test('el borde del campo de nombre tiene contraste >= 3:1', async ({ page }) => {
  expect(await borderContrast(page, '#dish-name')).toBeGreaterThanOrEqual(3);
});

test('el borde del botón Cancelar tiene contraste >= 3:1', async ({ page }) => {
  expect(await borderContrast(page, '.form-actions .btn-secondary')).toBeGreaterThanOrEqual(3);
});

test('el borde del toggle Disponible tiene contraste >= 3:1', async ({ page }) => {
  expect(await borderContrast(page, '.toggle')).toBeGreaterThanOrEqual(3);
});
