import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

export async function runAxe(page: Page, opts: { rules?: string[]; tags?: string[] } = {}) {
  // fade-in falsea el contraste: esperar a que terminen las animaciones
  await page.waitForFunction(() => document.getAnimations().length === 0);
  let builder = new AxeBuilder({ page });
  if (opts.rules) builder = builder.withRules(opts.rules);
  if (opts.tags) builder = builder.withTags(opts.tags);
  return builder.analyze();
}
