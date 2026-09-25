import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import http from 'node:http';
import { chromium } from 'playwright';
import { createStudio } from '../studio/server.js';
import { staticTranslationRows } from '../studio/i18n.js';
import { runJourney } from '@gbesse/agent-checkout-lab';
const storageDir = await mkdtemp(join(tmpdir(), 'frontier-browser-'));
const output = resolve('output/browser');
await mkdir(output, { recursive: true });
const studio = await createStudio({ port: 0, storageDir }),
  url = await studio.listen();
const browser = await chromium.launch({ headless: true });
let owned;
const checks = [];
const checked = (message) => {
  checks.push(message);
  console.log('✓ ' + message);
};
async function launchOwned(directory) {
  const process = spawn(globalThis.process.execPath, ['server.js'], {
    cwd: directory,
    env: { ...globalThis.process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const address = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Standalone app did not start')), 10000);
    let text = '';
    process.stdout.on('data', (chunk) => {
      text += chunk;
      const match = text.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) {
        clearTimeout(timer);
        resolve(match[0]);
      }
    });
    process.once('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
    process.once('exit', (code) => {
      clearTimeout(timer);
      reject(Error('Standalone exited: ' + code));
    });
  });
  return {
    url: address,
    stop: async () => {
      if (process.exitCode === null) {
        process.kill('SIGTERM');
        await once(process, 'exit');
      }
    },
  };
}
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.waitForSelector('nav a.active');
  const sourceHtml = await readFile(new URL('../studio/index.html', import.meta.url), 'utf8');
  const sourceText = await page.evaluate((html) => {
    const source = new DOMParser().parseFromString(html, 'text/html');
    const values = [];
    const walker = source.createTreeWalker(source.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement.closest('script,style')) continue;
      const value = node.textContent.replace(/\s+/g, ' ').trim();
      if (value) values.push(value);
    }
    for (const element of source.querySelectorAll('[placeholder],[aria-label],[title]')) {
      for (const name of ['placeholder', 'aria-label', 'title']) {
        const value = element.getAttribute(name);
        if (value) values.push(value);
      }
    }
    return values;
  }, sourceHtml);
  const localized = new Set(staticTranslationRows.map(([fr]) => fr));
  const languageNeutral = new Set([
    'f↗',
    'frontier',
    '↗',
    '01',
    '02',
    '03',
    '04',
    'Teachpack',
    'Branch',
    'Exit',
    'Agent Checkout',
    'FR',
    'EN',
    'ES',
    '↓',
    'f',
    'EXP. 001—004',
    '↳',
    '⑂',
    '⇱',
    '⌘',
    'JSON / V1',
    'Langue / Language / Idioma',
  ]);
  assert.deepEqual(
    [
      ...new Set(
        sourceText.filter((value) => !localized.has(value) && !languageNeutral.has(value)),
      ),
    ],
    [],
    'every static UI string must have FR/EN/ES translations',
  );
  await page.screenshot({ path: join(output, '01-studio.png'), fullPage: true });
  await page.getByRole('link', { name: '01 Teachpack', exact: true }).click();
  await page.locator('.technical-demo summary').click();
  await page.locator('#teach-examples').click();
  await page.waitForFunction(() =>
    document.querySelector('#record-status').textContent.startsWith('3 démonstrations'),
  );
  await page.locator('#teach-learn').click();
  await page.waitForFunction(() => !document.querySelector('#skill-download').disabled);
  assert.match(await page.locator('#skill-json').innerText(), /symbolic-trace-binding/);
  await page.locator('#teach-run').click();
  await page.locator('#teach-result .success').waitFor();
  await page.screenshot({ path: join(output, '02-teachpack.png'), fullPage: true });
  checked('Teachpack UI: demonstrations → learned skill → unseen business case');
  await page.getByRole('link', { name: '02 Branch', exact: true }).click();
  for (const variant of ['normal', 'stock', 'credit', 'failure', 'duplicate']) {
    await page.locator(`[data-variant="${variant}"]`).click();
    const response = page.waitForResponse((r) => r.url().endsWith('/api/branch/run'));
    await page.locator('#branch-run').click();
    assert.equal((await (await response).json()).scenarioPassed, true, variant);
    await page.locator('#branch-run:not([disabled])').waitFor();
  }
  await page.screenshot({ path: join(output, '03-branch.png'), fullPage: true });
  checked('Branch UI: all five scenarios have verified outcomes');
  await page.getByRole('link', { name: '03 Exit', exact: true }).click();
  await page.locator('#exit-inspect').click();
  await page.locator('#exit-generate:not([disabled])').waitFor();
  const generation = page.waitForResponse((r) => r.url().endsWith('/api/exit/generate'));
  await page.locator('#exit-generate').click();
  const artifact = await (await generation).json();
  await page.locator('#exit-artifact a').waitFor();
  await page.screenshot({ path: join(output, '04-exit.png'), fullPage: true });
  owned = await launchOwned(artifact.directory);
  const standalone = await browser.newPage();
  await standalone.goto(owned.url);
  await standalone.getByLabel('Notes i-101').waitFor();
  await standalone
    .getByLabel('Notes i-101')
    .fill('Modifié dans une application réellement autonome.');
  await standalone.getByLabel('Statut i-101').selectOption('done');
  await standalone
    .locator('article')
    .filter({ has: standalone.getByRole('heading', { name: 'Installer les luminaires' }) })
    .getByRole('button', { name: 'Enregistrer' })
    .click();
  await standalone.getByText('Enregistré sur votre disque.').waitFor();
  const persisted = JSON.parse(await readFile(join(artifact.directory, 'data.json'), 'utf8'));
  assert.equal(persisted.tickets[0].status, 'done');
  assert.match(persisted.tickets[0].notes, /réellement autonome/);
  const attachment = await fetch(owned.url + '/api/attachment?id=a-1');
  assert.equal(
    createHash('sha256')
      .update(Buffer.from(await attachment.arrayBuffer()))
      .digest('hex'),
    persisted.attachments[0].sha256,
  );
  assert.equal(
    (await fetch(owned.url + '/api/ticket', { method: 'PATCH', body: '{}' })).status,
    403,
  );
  const html = await (await fetch(owned.url)).text();
  const token = html.match(/(?:const token\s*=\s*|const token\s*=\s*\n\s*)['"]([a-f0-9]+)['"]/)[1];
  assert.equal(
    (
      await fetch(owned.url + '/api/ticket', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-workspace-token': token },
        body: JSON.stringify({ id: 'i-101', revision: 0, status: 'open', notes: '' }),
      })
    ).status,
    409,
  );
  await owned.stop();
  owned = await launchOwned(artifact.directory);
  await standalone.goto(owned.url);
  await standalone.getByLabel('Notes i-101').waitFor();
  assert.match(await standalone.getByLabel('Notes i-101').inputValue(), /réellement autonome/);
  await standalone.screenshot({ path: join(output, '05-owned-app.png'), fullPage: true });
  checked(
    'Exit: generated app edits persist after restart; attachment checksum, token and stale-edit protections verified',
  );
  await page.getByRole('link', { name: '04 Agent Checkout', exact: true }).click();
  for (const mode of ['before', 'after']) {
    await page.locator('#checkout-mode').selectOption(mode);
    const response = page.waitForResponse((r) => r.url().endsWith('/api/checkout/run'));
    await page.locator('#checkout-run').click();
    const report = await (await response).json();
    assert.equal(report.passed, mode === 'after');
    assert.equal(report.requests.length, mode === 'after' ? 1 : 0);
    await page.locator('#checkout-run:not([disabled])').waitFor();
  }
  await page.locator('#checkout-driver').selectOption('structured');
  const structured = page.waitForResponse((r) => r.url().endsWith('/api/checkout/run'));
  await page.locator('#checkout-run').click();
  assert.equal((await (await structured).json()).passed, true);
  await page.locator('#checkout-run:not([disabled])').waitFor();
  await page.screenshot({ path: join(output, '06-checkout.png'), fullPage: true });
  checked(
    'Checkout: semantic baseline fails before labels, passes after; structured adapter passes; stored quote verified',
  );
  const absent = await runJourney({
    url: url + '/fixture/checkout?mode=before',
    driver: 'structured',
    allowSubmit: true,
    timeoutMs: 1000,
  });
  assert.equal(absent.passed, false);
  assert.equal(absent.requests.length, 0);
  checked('Checkout refuses success when the structured interface is absent');
  let modelCalls = 0;
  const fakeProvider = http.createServer(async (req, res) => {
    let body = '';
    for await (const c of req) body += c;
    const request = JSON.parse(body);
    assert.equal(request.model, 'mock-protocol-only');
    assert.ok(request.messages[0].content.includes('untrusted'));
    const name = ['set_customer', 'set_product', 'submit_quote'][modelCalls++];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        choices: [
          {
            message: {
              tool_calls: [
                { id: 'call-' + modelCalls, type: 'function', function: { name, arguments: '{}' } },
              ],
            },
          },
        ],
      }),
    );
  });
  await new Promise((r) => fakeProvider.listen(0, '127.0.0.1', r));
  try {
    const report = await runJourney({
      url: url + '/fixture/checkout?mode=after',
      driver: 'model',
      allowSubmit: true,
      modelConfig: {
        baseURL: `http://127.0.0.1:${fakeProvider.address().port}/v1`,
        model: 'mock-protocol-only',
      },
      timeoutMs: 2500,
    });
    assert.equal(report.passed, true);
    assert.equal(modelCalls, 3);
    assert.equal(report.syntheticAgent, false);
  } finally {
    fakeProvider.closeAllConnections();
    await new Promise((r) => fakeProvider.close(r));
  }
  checked(
    'Optional model driver: protocol integration verified with a local mock, not a real model benchmark',
  );
  const falseSuccess = http.createServer((req, res) => {
    if (req.url.startsWith('/api/quote/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: 'fake', customerName: 'Wrong company', simulation: true }));
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(
        '<script>window.checkoutTools={requestQuote:async()=>({id:"fake"})}</script><p>Success!</p>',
      );
    }
  });
  await new Promise((r) => falseSuccess.listen(0, '127.0.0.1', r));
  try {
    const report = await runJourney({
      url: `http://127.0.0.1:${falseSuccess.address().port}`,
      driver: 'structured',
      allowSubmit: true,
      timeoutMs: 1000,
    });
    assert.equal(report.passed, false);
    assert.equal(report.error.code, 'RECEIPT_MISMATCH');
  } finally {
    falseSuccess.closeAllConnections();
    await new Promise((r) => falseSuccess.close(r));
  }
  checked('Independent quote oracle rejects a fake success message and mismatched stored data');
  await page.goto(url);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: join(output, '07-mobile.png'), fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  checked('Studio mobile layout: no horizontal overflow');
  assert.deepEqual(errors, []);
  checked('No uncaught UI JavaScript errors');
  await writeFile(
    join(output, 'verification.json'),
    JSON.stringify({ passed: true, checks, storageDir }, null, 2),
  );
  console.log(`Screenshots and verification: ${output}`);
} finally {
  await owned?.stop();
  await browser.close();
  await studio.close();
}
