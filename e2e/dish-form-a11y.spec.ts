import { test, expect, type Locator, type Page } from '@playwright/test';
import { getFirstDishId, getFirstRestaurantId } from './helpers/restaurant';

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

  test('nombre, Cancelar y Guardar muestran un contorno visible con contraste >= 3:1', async ({ page }) => {
    await page.goto(`/restaurants/${restaurantId}/dishes/new`);
    for (const target of [page.locator('#dish-name'), page.getByRole('link', { name: 'Cancelar' }), page.getByRole('button', { name: 'Guardar' })]) {
      await tabTo(page, target);
      await page.waitForFunction(() => document.getAnimations().length === 0); // .btn anima `all`
      const ring = await focusRing(target);
      expect(ring.style).toBe('solid');
      expect(ring.width).toBeGreaterThanOrEqual(2);
      expect(ring.ratio).toBeGreaterThanOrEqual(3);
    }
  });
});

test('tiene un h1 y un enlace "Volver a platos" con nombre accesible', async ({ page }) => {
  await page.goto(`/restaurants/${restaurantId}/dishes/new`);
  await expect(page.getByRole('heading', { level: 1, name: 'Nuevo plato' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Volver a platos' })).toBeVisible();
});

test('nombre, precio y descripción tienen label, obligatoriedad y sin tabindex', async ({ page }) => {
  await page.goto(`/restaurants/${restaurantId}/dishes/new`);
  const name = page.getByLabel('Nombre del plato');
  await expect(name).toHaveAttribute('aria-required', 'true');
  const price = page.getByLabel('Precio (€)');
  await expect(price).toHaveAttribute('inputmode', 'decimal');
  await expect(price).toHaveAttribute('aria-required', 'true');
  await expect(page.getByLabel('Descripción')).not.toHaveAttribute('tabindex', /.*/);
  await expect(page.getByText('* obligatorio')).toBeVisible();
  await expect(page.locator('form')).toHaveAttribute('novalidate', '');
});

test('la categoría es un grupo de botones aria-pressed con indicador no cromático', async ({ page }) => {
  await page.goto(`/restaurants/${restaurantId}/dishes/new`);
  const group = page.getByRole('group', { name: 'Categoría' });
  await expect(group.getByRole('button')).toHaveCount(4);
  const principal = group.getByRole('button', { name: 'Principal' });
  const postre = group.getByRole('button', { name: 'Postre' });
  await expect(principal).toHaveAttribute('aria-pressed', 'true');
  await expect(principal.locator('svg.chip-check')).toBeVisible();
  await expect(postre.locator('svg.chip-check')).toHaveCount(0);

  await postre.focus();
  await page.keyboard.press('Space');
  await expect(postre).toHaveAttribute('aria-pressed', 'true');
  await expect(principal).toHaveAttribute('aria-pressed', 'false');
  await expect(postre.locator('svg.chip-check')).toBeVisible();
});

test('Disponible es un switch con texto Sí/No y objetivo >= 24px', async ({ page }) => {
  await page.goto(`/restaurants/${restaurantId}/dishes/new`);
  const sw = page.getByRole('switch', { name: 'Disponible' });
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await expect(sw).toContainText('Sí');
  const box = await sw.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(24);
  expect(box!.width).toBeGreaterThanOrEqual(24);

  await sw.focus();
  await page.keyboard.press('Space');
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect(sw).toContainText('No');
});

test('ingredientes: controles etiquetados y botones reales de tamaño suficiente', async ({ page }) => {
  await page.goto(`/restaurants/${restaurantId}/dishes/new`);
  const select = page.getByLabel('Ingrediente', { exact: true });
  await expect(select.locator('option').first()).toHaveText('Selecciona un ingrediente');
  await expect(page.getByLabel('Cantidad')).toBeVisible();
  await select.selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Añadir ingrediente' }).click();

  const remove = page.getByRole('button', { name: /^Quitar / });
  await expect(remove).toBeVisible();
  const box = await remove.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(24);
  expect(box!.height).toBeGreaterThanOrEqual(24);

  await remove.focus();
  await page.keyboard.press('Enter');
  await expect(remove).toHaveCount(0);
});

test.describe('envío del formulario', () => {
  test('Guardar es submit y Enter en el nombre vacío valida', async ({ page }) => {
    await page.goto(`/restaurants/${restaurantId}/dishes/new`);
    await expect(page.getByRole('button', { name: 'Guardar' })).toHaveAttribute('type', 'submit');
    await page.locator('#dish-name').press('Enter');
    await expect(page.locator('.toast-error')).toContainText('Revisa los campos marcados');
  });

  test('Enter en Cantidad añade el ingrediente y no envía el formulario', async ({ page }) => {
    await page.goto(`/restaurants/${restaurantId}/dishes/new`);
    await page.getByLabel('Ingrediente', { exact: true }).selectOption({ index: 1 });
    await page.getByLabel('Cantidad').press('Enter');
    await expect(page.getByRole('button', { name: /^Quitar / })).toBeVisible();
    await expect(page.locator('.toast-error')).toHaveCount(0);
  });
});

test('los errores de validación se identifican por campo y se anuncian', async ({ page }) => {
  await page.goto(`/restaurants/${restaurantId}/dishes/new`);
  const name = page.locator('#dish-name');
  const price = page.locator('#dish-price');
  await name.press('Enter');

  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(price).toHaveAttribute('aria-invalid', 'true');
  const nameErrId = await name.getAttribute('aria-describedby');
  await expect(page.locator(`#${nameErrId}`)).toHaveText(/Indica el nombre del plato/);
  const priceDescribedBy = (await price.getAttribute('aria-describedby'))!.split(' ');
  const priceErr = page.locator(priceDescribedBy.map((id) => `#${id}`).join(','), { hasText: 'Introduce un precio mayor que 0' });
  await expect(priceErr).toBeVisible();

  const alert = page.getByRole('alert').filter({ hasText: 'Revisa los campos marcados' });
  await expect(alert).toBeVisible();
  await expect(name).toBeFocused();

  await page.waitForTimeout(5000); // no se autodescarta (WCAG 2.2.1)
  await expect(alert).toBeVisible();

  await name.fill('Plato de prueba');
  await expect(name).not.toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Indica el nombre del plato')).toHaveCount(0);
});

test.describe('foco inicial', () => {
  test('al crear, el nombre recibe el foco', async ({ page }) => {
    await page.goto(`/restaurants/${restaurantId}/dishes/new`);
    await expect(page.locator('#dish-name')).toBeFocused();
  });

  test('al editar, el foco no se mueve automáticamente al nombre', async ({ page, request }) => {
    const dishId = await getFirstDishId(request, restaurantId);
    await page.goto(`/restaurants/${restaurantId}/dishes/${dishId}/edit`);
    await expect(page.locator('#dish-name')).toBeVisible();
    await page.waitForTimeout(600); // el foco forzado actual se aplica a los 300 ms
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('BODY');
  });
});
