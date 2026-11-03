import fs from 'node:fs';
import { test, expect, type Page, type Locator } from '@playwright/test';
import { deleteDishesByName, getFirstRestaurantId, listDishes } from './helpers/restaurant';

test.use({
  video: { mode: 'on', size: { width: 1280, height: 720 } },
  viewport: { width: 1280, height: 720 },
});

let restaurantId: string;

const dishName = `Plato E2E ${Date.now()}`;

test.beforeEach(async ({ request }) => {
  restaurantId = await getFirstRestaurantId(request);
});

test.afterEach(async ({ request }) => {
  await deleteDishesByName(request, restaurantId, dishName);
  expect((await listDishes(request, restaurantId)).some((d) => d.name === dishName)).toBe(false);
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

async function stepTabOrder(page: Page) {
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
}

async function stepSpaceEnterAndIngredients(page: Page) {
  await page.goto(`/restaurants/${restaurantId}/dishes/new`);
  const group = page.getByRole('group', { name: 'Categoría' });
  const principal = group.getByRole('button', { name: 'Principal' });
  const postre = group.getByRole('button', { name: 'Postre' });
  const sw = page.getByRole('switch', { name: 'Disponible' });

  // Categoría con Espacio: Tab hasta Postre y Espacio
  await pressAndExpectFocus(page, 'Tab', page.locator('#dish-price'));
  await pressAndExpectFocus(page, 'Tab', group.getByRole('button', { name: 'Entrante' }));
  await pressAndExpectFocus(page, 'Tab', principal);
  await pressAndExpectFocus(page, 'Tab', postre);
  await page.keyboard.press('Space');
  await page.waitForTimeout(400);
  await expect(postre).toHaveAttribute('aria-pressed', 'true');
  await expect(principal).toHaveAttribute('aria-pressed', 'false');

  // Disponible con Espacio: Sí -> No -> Sí
  await pressAndExpectFocus(page, 'Tab', group.getByRole('button', { name: 'Bebida' }));
  await pressAndExpectFocus(page, 'Tab', sw);
  await page.keyboard.press('Space');
  await page.waitForTimeout(400);
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect(sw).toContainText('No');
  await page.keyboard.press('Space');
  await page.waitForTimeout(400);
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await expect(sw).toContainText('Sí');

  // Añadir ingrediente con teclado: select, cantidad, «+» con Enter
  await pressAndExpectFocus(page, 'Tab', page.locator('#dish-description'));
  const select = page.locator('#dish-ingredient');
  await pressAndExpectFocus(page, 'Tab', select);
  await select.selectOption({ index: 1 });
  await page.waitForTimeout(400);
  const qty = page.locator('#dish-ingredient-qty');
  await pressAndExpectFocus(page, 'Tab', qty);
  await qty.fill('2');
  await page.waitForTimeout(400);
  const add = page.getByRole('button', { name: 'Añadir ingrediente' });
  await pressAndExpectFocus(page, 'Tab', add);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  const remove = page.getByRole('button', { name: /^Quitar / });
  await expect(remove).toBeVisible();
  await expect(page.locator('.ingredient-chip')).toContainText('— 2');

  // Quitar el ingrediente: Shift+Tab hasta «Quitar …» y Enter
  await pressAndExpectFocus(page, 'Shift+Tab', qty);
  await pressAndExpectFocus(page, 'Shift+Tab', select);
  await pressAndExpectFocus(page, 'Shift+Tab', remove);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  await expect(remove).toHaveCount(0);
}

async function stepErrorsAndSave(page: Page) {
  await page.goto(`/restaurants/${restaurantId}/dishes/new`);
  const name = page.locator('#dish-name');
  const price = page.locator('#dish-price');

  // Enter con el formulario vacío (foco en nombre): errores visibles y foco en nombre
  await expectVisibleFocus(name);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(price).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Indica el nombre del plato')).toBeVisible();
  await expect(page.getByText('Introduce un precio mayor que 0')).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'Revisa los campos marcados' })).toBeVisible();
  await expectVisibleFocus(name);

  // Rellenar por teclado y llegar a Guardar con Tab
  await page.keyboard.type(dishName, { delay: 40 });
  await pressAndExpectFocus(page, 'Tab', price);
  await page.keyboard.press('Control+A');
  await page.keyboard.type('12.5', { delay: 40 });
  const save = page.getByRole('button', { name: 'Guardar' });
  for (let i = 0; i < 20 && !(await save.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(150);
  }
  await expectVisibleFocus(save);
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(new RegExp(`/restaurants/${restaurantId}/dishes$`));
  await expect(page.getByText(dishName)).toBeVisible();
  await page.waitForTimeout(800);
}

test('recorrido completo por teclado de dishes/new (genera el vídeo)', async ({ page }, testInfo) => {
  await stepTabOrder(page);
  await stepSpaceEnterAndIngredients(page);
  await stepErrorsAndSave(page);

  // Paso final: cerrar la página para que el vídeo se escriba y copiarlo a e2e-videos/
  const video = page.video()!;
  await page.close();
  const target = 'e2e-videos/dish-form-teclado.webm';
  fs.mkdirSync('e2e-videos', { recursive: true });
  await video.saveAs(target);
  expect(fs.existsSync(target)).toBe(true);
  expect(fs.statSync(target).size).toBeGreaterThan(0);
  await testInfo.attach('video-teclado', { path: target, contentType: 'video/webm' });
});
