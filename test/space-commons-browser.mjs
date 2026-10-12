import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { defaultRuntime } from '../packages/space-mission-lab/src/commons-engine.js';
import { createStudio } from '../studio/server.js';
import { messageTranslations } from '../studio/i18n.js';
const storageDir = await mkdtemp(join(tmpdir(), 'space-commons-browser-')),
  studio = await createStudio({ port: 0, storageDir }),
  origin = await studio.listen(),
  browser = await chromium.launch({ headless: true }),
  output = resolve('output/space-commons-browser');
await mkdir(output, { recursive: true });
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1050 },
      permissions: ['clipboard-read', 'clipboard-write'],
    }),
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
  page.on('pageerror', (error) => errors.push(error.message));
  const download = async (selector) => {
    const promise = page.waitForEvent('download');
    await page.locator(selector).click();
    const value = await promise;
    return { name: value.suggestedFilename(), bytes: await readFile(await value.path()) };
  };
  for (const [index, locale] of ['fr', 'en', 'es'].entries()) {
    for (const kind of ['benchmark', 'market', 'citizen']) {
      await open(`${origin}/space/commons/${kind}?lang=${locale}`);
      await page.locator('#commons-export:not([disabled])').waitFor();
      assert.equal(await page.locator('html').getAttribute('lang'), locale);
      assert.equal(
        await page.locator('#commons-replay').textContent(),
        messageTranslations.commonsReplay[index],
      );
      assert.ok(
        (await page.locator('#commons-status').textContent()).includes(
          messageTranslations.commonsCached[index],
        ),
      );
      assert.ok((await page.locator('#commons-chart svg').count()) > 0);
      if (kind === 'market')
        assert.ok(
          (await page.locator('#commons-results').textContent()).includes(
            messageTranslations.commonsReceipt[index],
          ),
        );
      await page.locator('#commons-check').click();
      assert.match(await page.locator('#commons-score').textContent(), /\/100/);
      const proof = await download('#commons-export');
      const report = JSON.parse(proof.bytes);
      assert.equal(report.locale, locale);
      assert.equal(report.kind, kind);
      assert.equal(new URL(report.challengeUrl).searchParams.get('lang'), locale);
      const card = await download('#commons-card');
      assert.match(card.name, /\.png$/);
      assert.ok(card.bytes.length > 10000);
      const href = await page.locator('#commons-link').inputValue();
      await open(href);
      await page.locator('#commons-export:not([disabled])').waitFor();
      await page.screenshot({ path: join(output, `${kind}-${locale}.png`), fullPage: true });
    }
  }
  // Replay alternate real results and source identity.
  await open(origin + '/space/commons/benchmark?lang=fr');
  await page.locator('#commons-export:not([disabled])').waitFor();
  await page.locator('#profile').selectOption('moon');
  await page.locator('#commons-replay').click();
  await page.locator('#commons-export:not([disabled])').waitFor();
  assert.match(await page.locator('#commons-provenance').textContent(), /de440s/);
  await page.locator('#commons-daily').click();
  await page.locator('#commons-replay').click();
  await page.locator('#commons-export:not([disabled])').waitFor();
  assert.ok(new URL(page.url()).searchParams.has('day'));
  await open(origin + '/space/commons/market?lang=es&seed=4294967295');
  await page.waitForFunction(
    () =>
      document.getElementById('commons-status').textContent.length > 0 &&
      !document.getElementById('commons-status').textContent.includes('calculando'),
  );
  assert.equal(
    await page.locator('#commons-status').textContent(),
    messageTranslations.commonsMissing[2],
  );
  assert.equal(await page.locator('#commons-export').isDisabled(), true);
  await open(origin + '/space/commons/citizen?lang=en&snr=999');
  assert.equal(
    await page.locator('#commons-status').textContent(),
    messageTranslations.commonsInvalid[1],
  );
  assert.equal(await page.locator('#commons-export').isDisabled(), true);
  // Fresh HTTP flow runs actual installed CPU engines, not a browser mock.
  await open(origin + '/space/commons/citizen?lang=en');
  await page.locator('#commons-export:not([disabled])').waitFor();
  const response = page.waitForResponse(
    (r) => r.url().endsWith('/api/space/commons') && r.request().method() === 'POST',
  );
  await page.locator('#commons-run').click();
  if (existsSync(join(defaultRuntime, 'venv/bin/python')))
    assert.equal(await page.locator('#snr').isDisabled(), true);
  const freshResponse = await response;
  const fresh = await freshResponse.json();
  if (existsSync(join(defaultRuntime, 'venv/bin/python'))) {
    assert.equal(freshResponse.status(), 200);
    assert.equal(fresh.execution, 'fresh');
    assert.equal(fresh.result.carrierHits, 1);
    await page.locator('#commons-export:not([disabled])').waitFor();
    assert.ok(
      (await page.locator('#commons-status').textContent()).includes(
        messageTranslations.commonsFresh[1],
      ),
    );
  } else {
    assert.equal(freshResponse.status(), 503);
    await page.waitForFunction(() => !document.getElementById('commons-run').disabled);
    assert.equal(
      await page.locator('#commons-status').textContent(),
      messageTranslations.commonsUnavailable[1],
    );
    assert.equal(await page.locator('#commons-export').isDisabled(), true);
  }
  assert.equal(await page.locator('#snr').isDisabled(), false);
  // No horizontal overflow on mobile in any language.
  await page.setViewportSize({ width: 390, height: 844 });
  for (const locale of ['fr', 'en', 'es'])
    for (const kind of ['benchmark', 'market', 'citizen']) {
      await open(`${origin}/space/commons/${kind}?lang=${locale}`);
      await page.locator('#commons-export:not([disabled])').waitFor();
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        true,
        kind + '/' + locale,
      );
    }
  await page.screenshot({ path: join(output, 'citizen-mobile-es.png'), fullPage: true });
  assert.deepEqual(errors, []);
  const session = await (await fetch(origin + '/api/space/scenario')).json();
  const invalid = await fetch(origin + '/api/space/commons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-studio-token': session.token },
    body: JSON.stringify({ kind: 'market', config: { seed: -1 }, locale: 'es' }),
  });
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).message, messageTranslations.commonsInvalid[2]);
  console.log(
    'Space Commons browser: FR / EN / ES, real replay, signatures, exports, daily links, CPU availability flow and mobile passed.',
  );
} finally {
  await browser.close();
  await studio.close();
  await rm(storageDir, { recursive: true, force: true });
}
