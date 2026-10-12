import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  lightCone,
  simulateRelay,
  exportIonContacts,
  reconcileCredits,
  syntheticSignals,
  searchSignals,
  runFrontier,
  dailyFrontier,
  frontierConfig,
  sharedFrontier,
  readSharedFrontier,
  spaceAtlas,
} from '../packages/space-mission-lab/src/index.js';
import { fingerprint } from '@gbesse/branch-lab';
import { messages } from '../packages/space-mission-lab/src/i18n.js';
import { createStudio } from '../studio/server.js';
const sample = JSON.parse(
  readFileSync(
    new URL('../packages/space-mission-lab/fixtures/sample.json', import.meta.url),
    'utf8',
  ),
);
const contact = (id, from, to, start, end, rate = 1, latency = 0) => ({
  id,
  from,
  to,
  start,
  end,
  rateBytesPerSec: rate,
  latencySec: latency,
  costUnits: 2,
});
const bundle = (id, priority = 1, bytes = 2, expiresAt = 100) => ({
  id,
  from: 'a',
  to: 'c',
  createdAt: 0,
  expiresAt,
  bytes,
  priority,
});
const network = () => ({
  schemaVersion: 1,
  nodes: ['a', 'b', 'c'],
  contacts: [contact('ab', 'a', 'b', 0, 5), contact('bc', 'b', 'c', 10, 15)],
  bundles: [bundle('science')],
});
const proof = {
  id: 'science',
  status: 'delivered',
  deliveredAt: 10,
  proofSha256: fingerprint('delivery'),
};
const receipt = (id, overrides = {}) => ({
  id,
  grantId: 'budget',
  branchId: 'main',
  sequence: 1,
  payee: 'provider',
  amountUnits: 20,
  proofId: proof.id,
  proofSha256: proof.proofSha256,
  reconcileAt: 20,
  ...overrides,
});
const economy = () => ({
  schemaVersion: 1,
  accounts: [
    { id: 'treasury', balanceUnits: 100 },
    { id: 'provider', balanceUnits: 0 },
  ],
  grants: [{ id: 'budget', origin: 'treasury', budgetUnits: 50 }],
  proofs: [proof],
  receipts: [receipt('receipt')],
});

test('light propagation gives physical lower bounds and rejects impossible calendars', () => {
  assert.ok(Math.abs(lightCone({ destination: 'moon' }).oneWaySeconds - 1.28222) < 0.00001);
  const p = lightCone({ destination: 'proxima' });
  assert.equal(p.roundTripSeconds / (365.25 * 86400), 8.5);
  assert.ok(p.earliestReplyAt.startsWith('2035-'));
  for (const input of [
    { destination: 'pluto' },
    { distanceKm: NaN },
    { distanceKm: -1 },
    { sentAt: '2026-02-30T00:00:00Z' },
    { sentAt: 'nonsense' },
  ])
    assert.throws(() => lightCone(input), { code: 'INVALID_FRONTIER' });
});
test('relay waits, honors expiry, and compares an immediate-only strategy', () => {
  const input = network(),
    before = structuredClone(input),
    result = simulateRelay(input);
  assert.equal(result.delivered, 1);
  assert.equal(result.bundles[0].deliveredAt, 12);
  assert.equal(result.bundles[0].hops[1].waitingSec, 8);
  assert.equal(simulateRelay(input, { policy: 'immediate-direct' }).delivered, 0);
  assert.equal(simulateRelay(input, { disabledContacts: ['bc'] }).delivered, 0);
  input.bundles[0].expiresAt = 11;
  assert.equal(simulateRelay(input).delivered, 0);
  assert.deepEqual(before, network());
});
test('contact serialization is bounded, nonfragmented and reserves descending priority', () => {
  const input = {
    schemaVersion: 1,
    nodes: ['a', 'c'],
    contacts: [contact('ac', 'a', 'c', 0, 5)],
    bundles: [bundle('low', 1), bundle('high', 90), bundle('third', 2)],
  };
  const result = simulateRelay(input);
  assert.equal(result.delivered, 2);
  assert.equal(result.bundles.find((b) => b.id === 'low').status, 'unreachable');
  const slots = result.reservations.ac;
  assert.deepEqual(
    slots.map((s) => [s.start, s.end]),
    [
      [0, 2],
      [2, 4],
    ],
  );
  assert.equal(result.bundles[0].id, 'high');
  input.bundles = [bundle('oversize', 1, 6)];
  assert.equal(simulateRelay(input).delivered, 0);
});
test('earliest arrival includes propagation, ignores cycles, and chooses a faster indirect route', () => {
  const input = network();
  input.contacts.push(contact('ac', 'a', 'c', 0, 100, 100, 30), contact('ba', 'b', 'a', 0, 100));
  const r = simulateRelay(input);
  assert.equal(r.bundles[0].deliveredAt, 12);
  assert.deepEqual(
    r.bundles[0].hops.map((h) => h.contactId),
    ['ab', 'bc'],
  );
});
test('ION export is directed and rounds capacity inward', () => {
  const input = network();
  input.contacts[0].start = 0.2;
  input.contacts[0].end = 4.9;
  input.contacts[0].latencySec = 0.2;
  const exportValue = exportIonContacts(input, { disabledContacts: ['bc'] });
  assert.equal(exportValue.text, '@ 0\n^ 1\na contact +1 +4 1 2 1\na range +1 +4 1 2 1\n');
});
test('relay and signal inputs reject unbounded or malformed work', () => {
  for (const change of [
    (n) => n.nodes.push('a'),
    (n) => (n.contacts[0].rateBytesPerSec = 0),
    (n) => (n.contacts[0].end = 0),
    (n) => (n.bundles[0].bytes = -1),
    (n) => (n.bundles = Array(25).fill(bundle('x'))),
  ]) {
    const input = network();
    change(input);
    assert.throws(() => simulateRelay(input), { code: 'INVALID_FRONTIER' });
  }
  assert.throws(() => searchSignals({ on: [], off: [] }));
  assert.throws(() =>
    searchSignals({
      on: [
        [1, 2, 3, 4],
        [1, 2, 3, NaN],
      ],
      off: [
        [1, 2, 3, 4],
        [1, 2, 3, 4],
      ],
    }),
  );
});
test('credits reserve rights, settle after receipt return and conserve all balances', () => {
  const input = economy(),
    before = structuredClone(input),
    local = reconcileCredits(input),
    final = reconcileCredits(input, { nowSec: 20 });
  assert.equal(local.payments[0].status, 'pending');
  assert.deepEqual(local.accounts, { treasury: 50, provider: 0 });
  assert.equal(local.escrowUnits, 50);
  assert.equal(final.settledUnits, 20);
  assert.equal(final.accounts.provider, 20);
  assert.equal(final.escrowUnits, 30);
  assert.equal(final.conservedUnits, 100);
  assert.deepEqual(input, before);
});
test('cloned wallets are locally tentative but all forked claims are quarantined', () => {
  const input = economy();
  input.receipts.push(receipt('fork', { branchId: 'clone', amountUnits: 21, reconcileAt: 40 }));
  const partial = reconcileCredits(input, { nowSec: 20 });
  assert.equal(partial.settledUnits, 0);
  assert.equal(partial.allArrived, false);
  assert.ok(partial.payments.every((p) => p.status === 'pending'));
  const final = reconcileCredits(input, { nowSec: 40 });
  assert.deepEqual(final.quarantinedGrants, ['budget']);
  assert.ok(final.payments.every((p) => p.status === 'conflict'));
  assert.equal(final.conservedUnits, 100);
  assert.equal(final.accounts.provider, 0);
});
test('duplicate claims never pay twice, invalid proofs and local overspending are blocked', () => {
  const input = economy();
  input.receipts.push(receipt('duplicate'));
  const duplicate = reconcileCredits(input, { nowSec: 20 });
  assert.equal(duplicate.settledUnits, 20);
  assert.equal(duplicate.payments[1].status, 'duplicate');
  input.receipts = [
    receipt('bad', { proofSha256: '0'.repeat(64) }),
    receipt('early', { reconcileAt: 9 }),
    receipt('large', { amountUnits: 51 }),
  ];
  const invalid = reconcileCredits(input, { nowSec: 100 });
  assert.deepEqual(
    invalid.payments.map((p) => p.status),
    ['invalid-proof', 'invalid-proof', 'budget-blocked'],
  );
  assert.equal(invalid.settledUnits, 0);
  input.grants[0].budgetUnits = 101;
  assert.throws(() => reconcileCredits(input), { code: 'INVALID_FRONTIER' });
});
test('a delivery cannot fund two independent grants without quarantine', () => {
  const input = economy();
  input.grants.push({ id: 'budget2', origin: 'treasury', budgetUnits: 50 });
  input.receipts.push(receipt('second', { grantId: 'budget2' }));
  const final = reconcileCredits(input, { nowSec: 20 });
  assert.deepEqual(final.quarantinedGrants.sort(), ['budget', 'budget2']);
  assert.equal(final.settledUnits, 0);
  assert.equal(final.conservedUnits, 100);
});
test('signal scan recovers injected drift and rejects matching OFF interference', () => {
  const input = syntheticSignals(42),
    before = structuredClone(input),
    r = searchSignals(input);
  assert.deepEqual(input, syntheticSignals(42));
  assert.deepEqual(input, before);
  assert.equal(r.candidates, 1);
  assert.ok(
    r.detections.some(
      (d) =>
        d.classification === 'synthetic-candidate' && d.startBin === 8 && d.driftBinsPerFrame === 1,
    ),
  );
  assert.ok(r.detections.some((d) => d.classification === 'interference' && d.startBin === 22));
  assert.equal(searchSignals(syntheticSignals(42, false)).candidates, 0);
});
test('share URLs round-trip only the whitelisted challenge settings', () => {
  const config = frontierConfig({
      destination: 'proxima',
      outage: true,
      doubleSpend: true,
      seed: 42,
      locale: 'es',
    }),
    url = new URL(sharedFrontier('https://example.test', config));
  assert.deepEqual(readSharedFrontier(url.search), config);
  assert.equal(url.pathname, '/space');
  assert.equal(url.hash, '#frontier');
  for (const query of [
    url.search + '&mission=secret',
    url.search + '&seed=9',
    url.search.replace('v=1', 'v=2'),
    url.search.replace('seed=42', 'seed=NaN'),
    '?lang=es&lang=fr',
    '?mission=secret',
  ])
    assert.throws(() => readSharedFrontier(query));
  assert.throws(() => sharedFrontier('file:///private', config));
  assert.throws(() => frontierConfig({ ...config, mission: 'private' }));
});
test('daily scenarios are stable per calendar day', () => {
  assert.deepEqual(dailyFrontier('2026-10-10'), dailyFrontier('2026-10-10'));
  assert.notEqual(dailyFrontier('2026-10-10').config.seed, dailyFrontier('2026-10-11').config.seed);
  for (const day of ['2026-02-30', '2026-99-01', 'yesterday', null])
    assert.throws(() => dailyFrontier(day), { code: 'INVALID_FRONTIER' });
});
test('integrated expedition connects mission data to delivery receipts in all three languages', () => {
  const before = structuredClone(sample),
    traces = [];
  for (const [index, locale] of ['fr', 'en', 'es'].entries()) {
    const report = runFrontier(sample, { locale });
    assert.equal(report.network.delivered, 3);
    assert.equal(report.comparison.delivered, 0);
    assert.equal(report.economy.after.settledUnits, 60);
    assert.equal(report.signals.candidates, 1);
    assert.equal(report.light.notice, messages.lightNotice[index]);
    assert.equal(report.economy.after.notice, messages.creditsNotice[index]);
    for (const payment of report.economy.after.payments)
      assert.equal(
        payment.proofSha256,
        report.network.bundles.find((b) => b.id === payment.proofId).proofSha256,
      );
    traces.push(report.network.traceSha256);
    assert.deepEqual(runFrontier(sample, { locale }), report);
    const cli = JSON.parse(
      execFileSync(
        process.execPath,
        ['packages/space-mission-lab/bin/cli.js', 'frontier', `--locale=${locale}`],
        { encoding: 'utf8' },
      ),
    );
    assert.deepEqual(cli, report);
  }
  assert.equal(new Set(traces).size, 1);
  assert.deepEqual(sample, before);
});
test('new API uses the existing session guard and atlas is server-rendered in FR/EN/ES', async () => {
  const storageDir = await mkdtemp(join(tmpdir(), 'frontier-api-')),
    studio = await createStudio({ storageDir, port: 0 }),
    origin = await studio.listen();
  try {
    const { token } = await (await fetch(origin + '/api/space/scenario')).json();
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mission: sample }),
    };
    assert.equal((await fetch(origin + '/api/space/frontier', options)).status, 403);
    for (const [index, locale] of ['fr', 'en', 'es'].entries()) {
      const response = await fetch(origin + '/api/space/frontier', {
        ...options,
        headers: { ...options.headers, 'x-studio-token': token },
        body: JSON.stringify({ mission: sample, config: { locale, doubleSpend: true } }),
      });
      assert.equal(response.status, 200);
      const r = await response.json();
      assert.equal(r.locale, locale);
      assert.equal(r.economy.after.settledUnits, 0);
      const invalid = await fetch(origin + '/api/space/frontier', {
        ...options,
        headers: { ...options.headers, 'x-studio-token': token },
        body: JSON.stringify({ mission: sample, config: { locale, seed: -1 } }),
      });
      assert.equal(invalid.status, 422);
      assert.equal((await invalid.json()).error.message, messages.frontierInvalid[index]);
      const html = await (await fetch(origin + `/space/explore?lang=${locale}`)).text();
      assert.ok(html.includes(`lang="${locale}"`));
      assert.ok(html.includes('ION-DTN'));
      assert.ok(html.includes(spaceAtlas(locale).entries[0].text));
      assert.ok(html.includes('hreflang="es"'));
      assert.ok(html.includes('og:description'));
    }
    const atlas = await (await fetch(origin + '/api/space/atlas?lang=en')).json();
    assert.equal(atlas.locale, 'en');
    assert.ok(atlas.daily.config.seed >= 0);
    assert.equal(atlas.ideas.filter((i) => i.href?.startsWith('/space/commons/')).length, 3);
    assert.ok(atlas.ideas.every((i) => i.state === 'built'));
  } finally {
    await studio.close();
    await rm(storageDir, { force: true, recursive: true });
  }
});
