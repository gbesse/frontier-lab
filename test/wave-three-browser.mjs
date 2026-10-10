import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { chromium } from 'playwright';
import { probeWarrantyJourney } from '../packages/garan-witness/src/index.js';
import { captureAgeProofEgress } from '../packages/age-proof-lab/src/index.js';

const canary = 'SYNTHETIC_AGE_PROOF_CANARY_BROWSER_12345';
const collector = http.createServer((req, res) => {
  res.writeHead(204);
  res.end();
});
collector.listen(0, '127.0.0.1');
await once(collector, 'listening');
const collectorOrigin = `http://127.0.0.1:${collector.address().port}`;
const site = http.createServer((req, res) => {
  const locale = req.url.split('/')[1] || 'fr';
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><html lang="${locale}"><body>
    <div id="legal-notice">${{ fr: 'garantie légale', en: 'legal guarantee', es: 'garantía legal' }[locale]}</div>
    <div id="garan">GARAN</div>
    ${req.url.includes('/leak') ? `<script>fetch('${collectorOrigin}/collect?proof=${canary}', {mode:'no-cors'})</script>` : ''}
    </body></html>`);
});
site.listen(0, '127.0.0.1');
await once(site, 'listening');
const origin = `http://127.0.0.1:${site.address().port}`;
const browser = await chromium.launch({ headless: true });
try {
  const pages = ['fr', 'en', 'es'].map((locale) => ({
    id: locale,
    url: `${origin}/${locale}`,
    expectedLocale: locale,
    noticeSelector: '#legal-notice',
    expectedNoticeText: { fr: 'garantie légale', en: 'legal guarantee', es: 'garantía legal' }[
      locale
    ],
    garanSelector: '#garan',
    expectGaran: true,
    expectedGaranText: 'GARAN',
  }));
  for (const locale of ['fr', 'en', 'es']) {
    const report = await probeWarrantyJourney({ pages }, { locale, browser });
    assert.ok(report.pages.every((page) => page.findings.length === 0));
  }
  for (const locale of ['fr', 'en', 'es']) {
    const report = await captureAgeProofEgress({
      url: `${origin}/${locale}`,
      canaries: [canary],
      locale,
      browser,
      run: async (page) => {
        const leaked = page.waitForRequest((request) => request.url().startsWith(collectorOrigin));
        await page.goto(`${origin}/${locale}/leak`);
        await leaked;
      },
    });
    assert.equal(report.findings.length, 1);
    assert.equal(report.status, 'issues_found');
    assert.match(report.captureSha256, /^[a-f0-9]{64}$/);
    assert.equal(JSON.stringify(report).includes(canary), false);
  }
  console.log('Three-language GARAN browser journey and synthetic age-proof egress probe passed.');
} finally {
  await browser.close();
  site.close();
  collector.close();
}
