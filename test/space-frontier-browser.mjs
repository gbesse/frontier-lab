import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';
import { createStudio } from '../studio/server.js';
import { messageTranslations, staticTranslationRows } from '../studio/i18n.js';
import { readSharedFrontier, spaceAtlas } from '../packages/space-mission-lab/src/index.js';
const storageDir = await mkdtemp(join(tmpdir(), 'space-frontier-browser-')),
  studio = await createStudio({ port: 0, storageDir }),
  origin = await studio.listen(),
  browser = await chromium.launch({ headless: true }),
  output = resolve('output/space-frontier-browser');
await mkdir(output, { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } }),
    errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const [index, locale] of ['fr', 'en', 'es'].entries()) {
    await page.goto(origin);
    await page.locator('#language-select').selectOption(locale);
    assert.equal(
      await page.locator('#space-discovery').textContent(),
      staticTranslationRows.find((row) => row[0] === 'Explorer la frontière spatiale ↗')[index],
    );
    await page.locator('#space-discovery').click();
    await page.locator('#frontier-export:not([disabled])').waitFor();
    assert.equal(await page.locator('#language-select').inputValue(), locale);
    assert.equal(
      await page.locator('[data-copy=commonsRepositories]').textContent(),
      messageTranslations.commonsRepositories[index],
    );
    assert.deepEqual(
      await page
        .locator('#space-repositories a')
        .evaluateAll((links) => links.map((link) => link.href)),
      ['mission-benchmark-commons', 'contact-market', 'citizen-mission'].map(
        (slug) => 'https://github.com/gbesse/' + slug,
      ),
    );
  }
  await page.goto(origin + '/space');
  await page.locator('#frontier-export:not([disabled])').waitFor();
  const run = async () => {
    const response = page.waitForResponse((r) => r.url().endsWith('/api/space/frontier'));
    await page.locator('#frontier-run').click();
    const report = await (await response).json();
    await page.locator('#frontier-export:not([disabled])').waitFor();
    return report;
  };
  const download = async (selector) => {
    const promise = page.waitForEvent('download');
    await page.locator(selector).click();
    const value = await promise;
    return { name: value.suggestedFilename(), bytes: await readFile(await value.path()) };
  };
  for (const [index, locale] of ['fr', 'en', 'es'].entries()) {
    await page.locator('#language-select').selectOption(locale);
    await page.locator('#frontier-destination').selectOption('proxima');
    await page.locator('#frontier-policy').selectOption('store-forward');
    await page.locator('#frontier-conflict').check();
    await page.locator('#frontier-outage').check();
    await page.locator('#frontier-inject').check();
    await page.locator('#frontier-seed').fill('42');
    const report = await run();
    assert.equal(report.locale, locale);
    assert.equal(report.light.roundTripSeconds / (365.25 * 86400), 8.5);
    assert.equal(report.network.delivered, 3);
    assert.equal(report.economy.after.settledUnits, 0);
    assert.equal(report.economy.after.quarantinedGrants.length, 1);
    assert.ok((await page.locator('#frontier-light').textContent()).includes('2035-'));
    assert.equal(await page.locator('#frontier-network tr').count(), 4);
    assert.equal(await page.locator('#frontier-credits tr').count(), 5);
    assert.equal(await page.locator('#frontier-spectrum svg rect').count(), 192);
    assert.equal(
      await page.locator('#frontier-status').textContent(),
      messageTranslations.frontierReady[index],
    );
    for (const element of await page.locator('[data-copy]').all()) {
      const key = await element.getAttribute('data-copy');
      assert.equal(await element.textContent(), messageTranslations[key][index]);
    }
    const json = await download('#frontier-export');
    assert.equal(json.name, `space-passport-${locale}.json`);
    assert.deepEqual(JSON.parse(json.bytes), report);
    const ion = await download('#frontier-ion');
    assert.equal(ion.bytes.toString(), report.ion.text);
    assert.ok(!ion.bytes.toString().includes('3 3'));
    const png = await download('#frontier-card');
    assert.equal(png.name, `space-card-${locale}.png`);
    assert.equal(png.bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.bytes.readUInt32BE(16), 1200);
    assert.equal(png.bytes.readUInt32BE(20), 630);
    await page.locator('#frontier-share').click();
    const url = await page.locator('#frontier-url').inputValue();
    assert.deepEqual(readSharedFrontier(new URL(url).search), report.config);
    assert.ok(!url.includes('mission='));
    const other = await browser.newPage();
    other.on('pageerror', (error) => errors.push(error.message));
    const replayResponse = other.waitForResponse((r) => r.url().endsWith('/api/space/frontier'));
    await other.goto(url);
    const replay = await (await replayResponse).json();
    await other.locator('#frontier-export:not([disabled])').waitFor();
    assert.deepEqual(replay, report);
    assert.equal(await other.locator('#language-select').inputValue(), locale);
    await other.close();
    await page.locator('#atlas-link').click();
    assert.equal(await page.locator('html').getAttribute('lang'), locale);
    assert.equal(
      await page.locator('.atlas-grid article').count(),
      spaceAtlas(locale).entries.length,
    );
    assert.equal(await page.locator('h1').textContent(), messageTranslations.atlasTitle[index]);
    assert.equal(await page.locator('link[hreflang]').count(), 3);
    await page.locator('.challenge-cta').click();
    await page.locator('#frontier-export:not([disabled])').waitFor();
    assert.equal(await page.locator('#frontier-destination').inputValue(), 'proxima');
  }
  await page.locator('#language-select').selectOption('fr');
  assert.ok((await page.locator('#frontier-status').textContent()).includes('ES'));
  const oldExport = await download('#frontier-export');
  assert.equal(JSON.parse(oldExport.bytes).locale, 'es');
  const oldCard = await download('#frontier-card');
  assert.equal(oldCard.name, 'space-card-es.png');
  await page.locator('#frontier-conflict').uncheck();
  await page.locator('#frontier-inject').uncheck();
  const withoutSignal = await run();
  assert.equal(withoutSignal.signals.candidates, 0);
  assert.equal(withoutSignal.economy.after.settledUnits, 60);
  await page.locator('#frontier-policy').selectOption('immediate-direct');
  const direct = await run();
  assert.equal(direct.network.delivered, 0);
  assert.equal(direct.comparison.delivered, 3);
  const daily = (await (await page.request.get(origin + '/api/space/atlas')).json()).daily;
  const response = page.waitForResponse((r) => r.url().endsWith('/api/space/frontier'));
  await page.locator('#frontier-daily').click();
  const dailyReport = await (await response).json();
  await page.locator('#frontier-export:not([disabled])').waitFor();
  assert.equal(dailyReport.config.seed, daily.config.seed);
  await page.locator('#frontier-destination').selectOption('proxima');
  await page.locator('#frontier-policy').selectOption('store-forward');
  await page.locator('#frontier-conflict').check();
  await page.locator('#frontier-inject').check();
  await run();
  const cardEvent = page.waitForEvent('download');
  await page.locator('#frontier-card').click();
  await (await cardEvent).saveAs(join(output, 'share-card-fr.png'));
  await page.locator('#frontier').scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(output, 'desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: join(output, 'mobile.png') });
  await page.goto(origin + '/space/explore?lang=fr');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: join(output, 'atlas-mobile.png') });
  await page.goto(origin + '/space?v=2&mission=private');
  await page.locator('#frontier-run:not([disabled])').waitFor();
  assert.equal(await page.locator('#frontier-export').isDisabled(), true);
  assert.equal(
    await page.locator('#frontier-status').textContent(),
    messageTranslations.frontierError[0],
  );
  await page
    .locator('.evidence')
    .last()
    .locator('details')
    .first()
    .evaluate((e) => (e.open = true));
  await page.locator('#mission').fill('{broken');
  await page.locator('#frontier-run').click();
  await page.waitForFunction(() =>
    document.querySelector('#frontier-status').textContent.includes('Expédition impossible'),
  );
  assert.equal(await page.locator('#frontier-export').isDisabled(), true);
  assert.deepEqual(errors, []);
  console.log(
    'Space expedition: FR/EN/ES, relay comparison, wallet forks, signal scan, daily challenge, share replay, PNG/JSON/ION exports, atlas, preserved report language and responsive layout verified.',
  );
} finally {
  await browser.close();
  await studio.close();
  await rm(storageDir, { recursive: true, force: true });
}
