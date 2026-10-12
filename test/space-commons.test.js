import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  commonsConfig,
  commonsLink,
  readCommons,
  dailyCommons,
  commonsNotices,
} from '../packages/space-mission-lab/src/commons.js';
import {
  commonsConfigId,
  readCommonsEvidence,
  verifyMarketReceipt,
  runCommons,
} from '../packages/space-mission-lab/src/commons-engine.js';
import { messageTranslations } from '../studio/i18n.js';
import { renderCommons } from '../studio/space-commons-page.js';

test('commons challenge links preserve bounded parameters, locale and version', () => {
  for (const kind of ['benchmark', 'market', 'citizen'])
    for (const locale of ['fr', 'en', 'es']) {
      const config = dailyCommons(kind, '2026-10-10'),
        url = commonsLink('https://example.org', kind, config, locale, '2026-10-10');
      assert.deepEqual(readCommons(url), { kind, config, locale, day: '2026-10-10' });
      assert.equal(readCommons(url + '&untrustedText=hello').config.seed, config.seed);
      assert.match(renderCommons(kind, locale), new RegExp(`<html lang="${locale}">`));
      assert.ok(commonsNotices[kind][locale]);
    }
  assert.equal(
    readCommons('https://example.org/en/space/commons/citizen/?lang=en').kind,
    'citizen',
  );
  assert.throws(
    () => readCommons('https://example.org/space/commons/benchmark?v=unknown'),
    /COMMONS_VERSION/,
  );
  for (const input of [
    { stepSec: 1 },
    { stepSec: '30' },
    { stepSec: Infinity },
    { profile: '../' },
    { extra: 1 },
  ])
    assert.throws(() => commonsConfig('benchmark', input));
  for (const seed of [-1, 4294967296, 1.1, NaN, '42'])
    assert.throws(() => commonsConfig('market', { seed }));
  assert.throws(() => commonsConfig('__proto__'));
  assert.throws(() => commonsConfig('market', { constructor: 42 }));
  assert.equal(
    commonsConfigId('market', { seed: 42 }),
    commonsConfigId('market', { outage: 'none', budgetUnits: 100, seed: 42 }),
  );
});
test('all commons UI messages preserve placeholders in FR EN ES', () => {
  for (const [key, row] of Object.entries(messageTranslations).filter(([key]) =>
    key.startsWith('commons'),
  )) {
    assert.equal(row.length, 3, key);
    const placeholders = (value) => (value.match(/\{\w+\}/g) || []).sort();
    for (const text of row) {
      assert.ok(text.length > 0, key);
      assert.deepEqual(placeholders(text), placeholders(row[0]), key);
    }
  }
});
test('unavailable engines fail closed rather than returning synthetic results', async () => {
  await assert.rejects(
    runCommons('benchmark', {}, { runtime: resolve('.local/does-not-exist') }),
    /COMMONS_ENGINE_UNAVAILABLE/,
  );
});
test('published evidence rejects tampering', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'commons-evidence-'));
  try {
    const config = { profile: 'iss', stepSec: 30 },
      id = commonsConfigId('benchmark', config),
      source = resolve('packages/space-mission-lab/fixtures/commons', id + '.json'),
      raw = await readFile(source, 'utf8');
    await writeFile(join(directory, id + '.json'), raw);
    const r = await readCommonsEvidence('benchmark', config, directory);
    assert.equal(r.execution, 'replay');
    assert.equal(r.result.passed, true);
    r.result.maxEngineDifferenceM = 0;
    await writeFile(join(directory, id + '.json'), JSON.stringify(r));
    await assert.rejects(
      readCommonsEvidence('benchmark', config, directory),
      /COMMONS_EVIDENCE_INTEGRITY/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
test('receipt signature rejects altered credit settlement', async () => {
  const report = await readCommonsEvidence(
    'market',
    {},
    resolve('packages/space-mission-lab/fixtures/commons'),
  );
  assert.equal(verifyMarketReceipt(report.result.receipt), true);
  const tampered = structuredClone(report.result.receipt);
  tampered.payload.settledUnits += 1;
  assert.equal(verifyMarketReceipt(tampered), false);
  assert.equal(tampered.payload.budgetUnits, 100);
});

test('a full year of daily challenges stays within the published static catalog', async () => {
  const cases = new Map();
  for (let day = 1; day <= 365; day++) {
    const date = new Date(Date.UTC(2027, 0, day)).toISOString().slice(0, 10);
    for (const kind of ['benchmark', 'market', 'citizen']) {
      const config = dailyCommons(kind, date);
      cases.set(commonsConfigId(kind, config), [kind, config]);
    }
  }
  assert.ok(cases.size <= 26);
  for (const [kind, config] of cases.values())
    await readCommonsEvidence(kind, config, resolve('packages/space-mission-lab/fixtures/commons'));
});
