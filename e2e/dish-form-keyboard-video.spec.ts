import { test, expect, type Page, type Locator } from '@playwright/test';
import { getFirstRestaurantId } from './helpers/restaurant';

test.use({
  video: { mode: 'on', size: { width: 1280, height: 720 } },
  viewport: { width: 1280, height: 720 },
});

let restaurantId: string;

test.beforeEach(async ({ request }) => {
  restaurantId = await getFirstRestaurantId(request);
});

async function expectVisibleFocus(target: Locator) {
  await expect(target).toBeFocused();
  const ring = await target.evaluate((el) => {
    const s = getComputedStyle(el);
    return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
  });
  expect(ring.style).not.toBe('none');
  expect(ring.width).toBeGreaterThanOrEqual(2);
}

/** Pulsa una tecla, espera una pausa para que se vea en el vídeo y comprueba el foco visible. */
async function pressAndExpectFocus(page: Page, key: string, target: Locator) {
  await page.keyboard.press(key);
  await page.waitForTimeout(400);
  await page.waitForFunction(() => document.getAnimations().length === 0);
  await expectVisibleFocus(target);
}

test('recorrido por teclado: Tab y Shift+Tab por todos los controles', async ({ page }) => {
  await page.goto(`/restaurants/${restaurantId}/dishes/new`);
  const group = page.getByRole('group', { name: 'Categoría' });
  const order: Locator[] = [
    page.locator('#dish-name'),
    page.locator('#dish-price'),
    group.getByRole('button', { name: 'Entrante' }),
    group.getByRole('button', { name: 'Principal' }),
    group.getByRole('button', { name: 'Postre' }),
    group.getByRole('button', { name: 'Bebida' }),
    page.getByRole('switch', { name: 'Disponible' }),
    page.locator('#dish-description'),
    page.locator('#dish-ingredient'),
    page.locator('#dish-ingredient-qty'),
    page.getByRole('button', { name: 'Añadir ingrediente' }),
  ];

  await expectVisibleFocus(order[0]); // foco inicial al crear
  for (const next of order.slice(1)) await pressAndExpectFocus(page, 'Tab', next);

  // Shift+Tab hacia atrás una vez (cantidad) y otra vez adelante
  await pressAndExpectFocus(page, 'Shift+Tab', order[9]);
  await pressAndExpectFocus(page, 'Tab', order[10]);
});
