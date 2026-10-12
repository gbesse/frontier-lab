import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStudio } from '../studio/server.js';
import { matterTranslations } from '../studio/i18n.js';
const storageDir = await mkdtemp(join(tmpdir(), 'matter-browser-'));
const studio = await createStudio({ port: 0, storageDir });
const origin = await studio.listen();
const browser = await chromium.launch({ headless: true });
try {
  for (const [i, locale] of ['fr', 'en', 'es'].entries()) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${origin}/matter?lang=${locale}`);
    await page.waitForSelector('#projects a');
    assert.equal(await page.locator('h1').textContent(), matterTranslations.title[i]);
    assert.equal(await page.locator('#projects article').count(), 10);
    const links = await page.locator('#projects a').evaluateAll((xs) => xs.map((x) => x.href));
    for (const href of links) {
      await page.goto(href);
      await page.waitForSelector('body[data-ready="true"]');
      assert.equal(JSON.parse(await page.locator('#report').textContent()).locale, locale);
      assert.ok(await page.locator('#chart svg').count());
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
  await studio.close();
  await rm(storageDir, { recursive: true, force: true });
}
await import('../packages/fabreplay/test/browser.mjs');
await import('../packages/switchbench/test/browser.mjs');
await import('../packages/microfabgym/test/browser.mjs');
await import('../packages/coolantforge/test/browser.mjs');
await import('../packages/qualifydiff/test/browser.mjs');
await import('../packages/fabport/test/browser.mjs');
await import('../packages/fabresume/test/browser.mjs');
await import('../packages/measureplan/test/browser.mjs');
await import('../packages/microblocks/test/browser.mjs');
await import('../packages/fabtrace/test/browser.mjs');
