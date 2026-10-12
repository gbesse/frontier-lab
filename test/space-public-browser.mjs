import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { chromium } from 'playwright';
import { messageTranslations } from '../studio/i18n.js';
const reserve = createServer();
await new Promise((resolve) => reserve.listen(0, '127.0.0.1', resolve));
const port = reserve.address().port;
await new Promise((resolve) => reserve.close(resolve));
const server = spawn(
    'python3',
    [
      '-m',
      'http.server',
      String(port),
      '--bind',
      '127.0.0.1',
      '--directory',
      'output/space-public',
    ],
    { stdio: 'ignore' },
  ),
  origin = `http://127.0.0.1:${port}`,
  browser = await chromium.launch({ headless: true });
try {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      await fetch(origin);
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  const page = await browser.newPage(),
    errors = [];
  const open = async (url) => {
    await page.goto(url);
    await page.waitForFunction(
      () =>
        document.getElementById('commons-status')?.textContent ||
        !document.getElementById('commons-form'),
    );
    if (
      (await page.locator('#commons-replay').count()) &&
      (await page.locator('#commons-status').textContent()) ===
        messageTranslations.commonsStartChallenge[
          { fr: 0, en: 1, es: 2 }[await page.locator('html').getAttribute('lang')]
        ]
    ) {
      await page.locator('#commons-replay').click();
      await page.waitForFunction(() => !document.getElementById('commons-replay').disabled);
    }
  };
  page.on('pageerror', (e) => errors.push(e.message));
  for (const [index, locale] of ['fr', 'en', 'es'].entries())
    for (const kind of ['benchmark', 'market', 'citizen']) {
      await open(`${origin}/${locale}/space/commons/${kind}/?lang=${locale}`);
      await page.locator('#commons-export:not([disabled])').waitFor();
      assert.equal(await page.locator('html').getAttribute('lang'), locale);
      assert.equal(await page.locator('#commons-run').count(), 0);
      assert.equal(
        await page.locator('#commons-replay').textContent(),
        messageTranslations.commonsReplay[index],
      );
      assert.ok(new URL(page.url()).pathname.startsWith('/' + locale + '/'));
      const hreflang = await page.locator('link[hreflang="en"]').getAttribute('href');
      assert.ok(hreflang.startsWith('/en/'), hreflang);
      await page.locator('.commons-language[lang="en"]').click();
      await page.locator('#commons-replay').click();
      await page.locator('#commons-export:not([disabled])').waitFor();
      assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    }
  const api = await fetch(origin + '/api/state');
  assert.equal(api.status, 404);
  await open(origin + '/es/space/explore/');
  assert.equal(await page.locator('html').getAttribute('lang'), 'es');
  assert.equal(await page.locator('a[href*="/space/commons/"]').count(), 3);
  await open(origin + '/en/space/commons/market/?lang=en&seed=9000');
  await page.waitForFunction(() =>
    document.getElementById('commons-status').textContent.startsWith('This configuration'),
  );
  assert.equal(await page.locator('#commons-export').isDisabled(), true);
  assert.deepEqual(errors, []);
  console.log(
    'Public static edition: FR / EN / ES, links, provenance and unavailable cases passed; no local APIs published.',
  );
} finally {
  await browser.close();
  server.kill('SIGTERM');
}
