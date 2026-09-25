import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { createStudio } from '../studio/server.js';

const storageDir = await mkdtemp(join(tmpdir(), 'teach-visual-'));
const output = resolve('output/browser');
await mkdir(output, { recursive: true });
let observations = 0;
let emitClick;
const visualRecognizer =
  process.platform === 'darwin'
    ? undefined
    : async (path) => [
        {
          text: path.includes('/observations/')
            ? observations++ === 0
              ? 'SCREEN ONE'
              : 'FINISH SUCCESS'
            : path.endsWith('/0.jpg')
              ? 'SCREEN ONE'
              : 'FINISH SUCCESS',
          confidence: 1,
        },
      ];
const studio = await createStudio({
  port: 0,
  storageDir,
  visualRecognizer,
  clickMonitorFactory: async (callback) => {
    emitClick = callback;
    return { enabled: true, stop() {} };
  },
});
const url = await studio.listen();
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    let activeCanvas;
    const draw = (label) => {
      const context = activeCanvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, 900, 500);
      context.fillStyle = '#172c27';
      context.font = 'bold 82px Arial';
      context.fillText(label, 55, 230);
    };
    Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', {
      configurable: true,
      value: async () => {
        activeCanvas = document.createElement('canvas');
        activeCanvas.width = 900;
        activeCanvas.height = 500;
        draw('SCREEN ONE');
        window.visualTestAdvance = () => draw('FINISH SUCCESS');
        const stream = activeCanvas.captureStream(5);
        const track = stream.getVideoTracks()[0];
        Object.defineProperty(track, 'getSettings', {
          value: () => ({ displaySurface: 'monitor' }),
        });
        return stream;
      },
    });
  });
  await page.goto(url + '/#teach');
  await page.locator('#language-select').selectOption('en');
  assert.equal(await page.locator('#visual-start').innerText(), 'Share and record');
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  await page.locator('nav a[href="#home"]').click();
  assert.match(await page.locator('#home h1').innerText(), /Work,/);
  await page.locator('nav a[href="#branch"]').click();
  assert.match(await page.locator('#branch h1').innerText(), /agent/);
  await page.locator('nav a[href="#exit"]').click();
  assert.match(await page.locator('#exit h1').innerText(), /Your data/);
  await page.locator('nav a[href="#checkout"]').click();
  assert.match(await page.locator('#checkout h1').innerText(), /agent/);
  await page.locator('nav a[href="#teach"]').click();
  await page.locator('#language-select').selectOption('es');
  assert.equal(await page.locator('#visual-start').innerText(), 'Compartir y grabar');
  await page.reload();
  assert.equal(await page.locator('#language-select').inputValue(), 'es');
  assert.equal(await page.locator('#visual-start').innerText(), 'Compartir y grabar');
  await page.locator('#language-select').selectOption('en');
  await page.locator('#visual-capture-clicks').check();
  await page.locator('#visual-start').click();
  await page.waitForFunction(() => document.querySelectorAll('.visual-frame').length >= 1, null, {
    timeout: 45000,
  });
  emitClick({ type: 'click', button: 'left', x: 0.42, y: 0.31, at: Date.now() });
  await page.evaluate(() => window.visualTestAdvance());
  await page.waitForFunction(() => document.querySelectorAll('.visual-frame').length >= 2, null, {
    timeout: 30000,
  });
  await page.locator('#visual-stop').click();
  await page.waitForFunction(
    () => document.querySelector('#visual-click-status').textContent.includes('Clicks detected: 1'),
    null,
    { timeout: 30000 },
  );
  assert.match(await page.locator('#visual-click-status').innerText(), /Clicks detected: 1/);
  await page.locator('#visual-compile:not([disabled])').waitFor();
  const steps = page.locator('.visual-frame');
  assert.equal(await steps.nth(1).locator('.click-marker').count(), 1);
  await steps.nth(1).locator('input[type="text"]').fill('Check visible confirmation');
  await page.locator('#visual-compile').click();
  await page.locator('#visual-follow:not([disabled])').waitFor();
  const state = await (await page.request.get(url + '/api/state')).json();
  assert.equal(state.visualRecordings.length, 1);
  assert.equal(state.visualRecordings[0].clicks.length, 1);
  assert.equal(state.visualRecordings[0].clickCapture.enabled, true);
  assert.equal(state.visualSkills.length, 1);
  assert.equal(state.visualSkills[0].skill.steps.length, 2);
  assert.equal(state.visualSkills[0].skill.locale, 'en');
  assert.equal(state.visualSkills[0].skill.steps[0].instruction, 'Starting screen');
  assert.equal(state.visualSkills[0].skill.steps[1].instruction, 'Check visible confirmation');
  assert.deepEqual(state.visualSkills[0].skill.steps[1].interactions, [
    { atMs: state.visualRecordings[0].clicks[0].atMs, button: 'left', x: 0.42, y: 0.31 },
  ]);
  assert.ok(state.visualSkills[0].skill.steps[0].markers.some((s) => s.includes('SCREEN ONE')));
  assert.ok(state.visualSkills[0].skill.steps[1].markers.some((s) => s.includes('FINISH SUCCESS')));
  await page.locator('#language-select').selectOption('es');
  assert.match(await page.locator('#toast').innerText(), /Guía visual creada/);
  assert.match(await page.locator('#visual-follow-status').innerText(), /Guía visual creada/);
  assert.equal(await page.locator('.follow-reference img').count(), 1);
  assert.match(await page.locator('.follow-reference figcaption').innerText(), /referencia/);
  await page.screenshot({ path: join(output, '08-teachpack-visual.png'), fullPage: true });
  await page.reload();
  assert.equal(await page.locator('.follow-reference img').count(), 1);
  assert.equal(await page.locator('#visual-follow').isEnabled(), true);
  await page.locator('#visual-follow').click();
  await page.waitForFunction(
    () => document.querySelector('#visual-follow-status').textContent.includes('Paso 2/2'),
    null,
    { timeout: 30000 },
  );
  assert.match(
    await page.locator('#visual-follow-status .click-evidence').innerText(),
    /clic izquierdo/,
  );
  assert.equal(await page.locator('.follow-reference .click-marker').count(), 1);
  assert.match(
    await page.locator('.follow-reference figcaption').innerText(),
    /pantalla anterior/i,
  );
  assert.match(await page.locator('.follow-reference img').getAttribute('src'), /frame=0/);
  assert.equal(
    await page
      .locator('.follow-reference img')
      .evaluate((image) => image.complete && image.naturalWidth > 0),
    true,
  );
  await page.screenshot({ path: join(output, '10-teachpack-click-reference.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('#language-select').selectOption('fr');
  assert.match(await page.locator('#visual-follow-status').innerText(), /Étape 2\/2/);
  assert.match(await page.locator('.follow-reference figcaption').innerText(), /Écran précédent/);
  await page.locator('#language-select').selectOption('en');
  assert.match(await page.locator('.follow-reference figcaption').innerText(), /Previous screen/);
  await page.locator('#language-select').selectOption('fr');
  await page.evaluate(() => window.visualTestAdvance());
  await page.waitForFunction(
    () =>
      document.querySelector('#visual-follow-status').textContent.includes('2 étapes reconnues'),
    null,
    { timeout: 30000 },
  );
  await page.locator('#visual-follow-stop').click();
  await page.locator('#language-select').selectOption('es');
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: join(output, '09-teachpack-visual-mobile.png'), fullPage: true });
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, 'visual-verification.json'),
    JSON.stringify(
      {
        passed: true,
        frames: state.visualRecordings[0].frames.length,
        steps: 2,
        ocr: process.platform === 'darwin' ? 'Apple Vision' : 'test double',
        storageDir,
      },
      null,
      2,
    ),
  );
  console.log(
    '✓ Teachpack screen sharing: two actual video frames, OCR, reviewed visual guide, live follow completed',
  );
} finally {
  await browser.close();
  await studio.close();
}
