import { execSync } from 'node:child_process';
import { test as setup, expect } from '@playwright/test';

export const AUTH_FILE = 'e2e/.auth/admin.json';

setup('autenticar como admin', async ({ page }) => {
  execSync('npm run seed', { stdio: 'ignore' });

  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('admin@resttek.com');
  await page.getByLabel('Contraseña').fill('admin@resttek.com');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).not.toHaveURL(/\/login/);

  await page.context().storageState({ path: AUTH_FILE });
});
