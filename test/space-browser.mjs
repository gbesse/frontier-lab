import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { createStudio } from '../studio/server.js';
import { messageTranslations } from '../studio/i18n.js';
const storageDir = await mkdtemp(join(tmpdir(), 'space-browser-'));
const studio = await createStudio({ port: 0, storageDir });
const origin = await studio.listen();
const browser = await chromium.launch({ headless: true });
const output = resolve('output/space-browser');
await mkdir(output, { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(origin);
  await page.locator('a[href="/space"]').click();
  await page.locator('#run:not([disabled])').waitFor();
  for (const [index, locale] of ['fr', 'en', 'es'].entries()) {
    await page.locator('#language-select').selectOption(locale);
    assert.equal(await page.locator('h1').textContent(), messageTranslations.spaceSubtitle[index]);
    for (const fault of ['nominal', 'link-outage', 'low-power', 'sensor-stale']) {
      await page.locator('#fault').selectOption(fault);
      await page.locator('#policy').selectOption('guarded');
      const responsePromise = page.waitForResponse((response) =>
        response.url().endsWith('/api/space/run'),
      );
      await page.locator('#run').click();
      const response = await responsePromise;
      await page.locator('#export:not([disabled])').waitFor();
      const report = await response.json();
      assert.equal(report.locale, locale);
      assert.equal(report.replay.safe, true);
      assert.equal(report.validation.total, 7);
      assert.equal(
        await page.locator('#status').textContent(),
        messageTranslations.spaceReady[index],
      );
      assert.equal(await page.locator('#events tr').count(), 6);
      assert.equal(await page.locator('#cases tr').count(), 8);
      if (fault !== 'nominal') {
        const source = page.locator('#alerts a').first();
        await source.click();
        assert.ok(await page.locator(await source.getAttribute('href')).count());
      }
    }
    await page.locator('#policy').selectOption('unguarded');
    const responsePromise = page.waitForResponse((response) =>
      response.url().endsWith('/api/space/run'),
    );
    await page.locator('#run').click();
    const report = await (await responsePromise).json();
    await page.locator('#export:not([disabled])').waitFor();
    assert.equal(report.replay.safe, false);
    assert.ok(report.validation.passed < 7);
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export').click();
    const download = await downloadPromise;
    const exported = JSON.parse(await readFile(await download.path(), 'utf8'));
    assert.deepEqual(exported, report);
    assert.equal(download.suggestedFilename(), `space-mission-${locale}.json`);
    for (const element of await page.locator('[data-copy]').all()) {
      const key = await element.getAttribute('data-copy');
      assert.equal(await element.textContent(), messageTranslations[key][index]);
    }
  }
  await page.locator('#language-select').selectOption('fr');
  assert.ok((await page.locator('#status').textContent()).includes('ES'));
  assert.equal(JSON.parse(await page.locator('#report').textContent()).locale, 'es');
  await page.locator('#fault').selectOption('nominal');
  await page.locator('#policy').selectOption('guarded');
  await page.locator('#run').click();
  await page.locator('#export:not([disabled])').waitFor();
  await page.screenshot({ path: join(output, 'desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: join(output, 'mobile.png'), fullPage: true });
  await page
    .locator('.evidence details')
    .first()
    .evaluate((element) => (element.open = true));
  await page.locator('#mission').fill('{broken');
  await page.locator('#run').click();
  await page.waitForFunction(() =>
    document.querySelector('#status').textContent.includes('Exécution impossible'),
  );
  assert.ok(await page.locator('#export').isDisabled());
  assert.deepEqual(errors, []);
  console.log(
    'Space Mission Lab: four flows, guarded/unguarded policies, JSON export, input errors and responsive layout verified in FR/EN/ES.',
  );
} finally {
  await browser.close();
  await studio.close();
  await rm(storageDir, { recursive: true, force: true });
}
