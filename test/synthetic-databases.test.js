import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  askJev,
  buildDatabases,
  generateDatabases,
  validateDatabase,
} from '../scripts/synthetic-databases.mjs';

test('seeded relational databases keep business constraints and localize generated names', () => {
  for (const [locale, expected] of [
    ['fr', 'Client fictif'],
    ['en', 'Synthetic Customer'],
    ['es', 'Cliente ficticio'],
  ]) {
    const first = generateDatabases(42, locale);
    const second = generateDatabases(42, locale);
    assert.deepEqual(first, second);
    assert.equal(first[0].tables.customers[0].displayName.startsWith(expected), true);
    assert.equal(first.length, 3);
    for (const database of first) assert.deepEqual(validateDatabase(database), []);
  }
  const changed = generateDatabases(43, 'fr');
  assert.notDeepEqual(
    changed[0].tables.workOrders,
    generateDatabases(42, 'fr')[0].tables.workOrders,
  );
  const tampered = generateDatabases(42, 'fr')[1];
  tampered.tables.invoices[0].total = -1;
  assert.ok(validateDatabase(tampered).some((error) => error.includes('total mismatch')));
});

test('Jev request uses bounded aggregate evidence and rejects invalid answer shapes', async () => {
  const database = generateDatabases(42)[0];
  const fetchImpl = async (_url, options) => {
    assert.equal(options.method, 'POST');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.authorization, 'Bearer test-key');
    const request = JSON.parse(options.body);
    assert.equal(request.model, 'jev-1.13.0');
    const evidence = JSON.parse(request.state.evidence);
    assert.equal(evidence.counts.workOrders, 180);
    assert.equal(evidence.samples.workOrders.length, 3);
    assert.equal(JSON.stringify(evidence).includes('test-key'), false);
    return {
      ok: true,
      json: async () => ({
        model: request.model,
        answers: {
          credibility: {
            type: 'choice',
            choice: 'credible',
            confidence: 0.8,
            probabilities: { credible: 0.9, review: 0.08, implausible: 0.02 },
          },
        },
      }),
    };
  };
  assert.equal((await askJev(database, { apiKey: 'test-key', fetchImpl })).choice, 'credible');
  await assert.rejects(
    askJev(database, {
      apiKey: 'test-key',
      fetchImpl: async () => ({ ok: true, json: async () => ({ model: 'wrong', answers: {} }) }),
    }),
    /Invalid Jev response/,
  );
});

test('build writes three SQLite databases with foreign keys and a Jev audit report', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'synthetic-databases-'));
  const outputDir = join(parent, 'run');
  const reviewer = async () => ({
    model: 'jev-1.13.0',
    choice: 'credible',
    confidence: 0.8,
    probabilities: { credible: 0.9, review: 0.08, implausible: 0.02 },
  });
  const manifest = await buildDatabases({ seed: 42, locale: 'es', outputDir, reviewer });
  assert.equal(manifest.reports.length, 3);
  assert.ok(
    manifest.reports.every((report) => report.status === 'accepted' && report.sha256.length === 64),
  );
  const stored = JSON.parse(await readFile(join(outputDir, 'validation.json'), 'utf8'));
  assert.deepEqual(stored, manifest);
  for (const name of ['maintenance', 'invoicing', 'payees']) {
    const database = new DatabaseSync(join(outputDir, `${name}.sqlite`), { readOnly: true });
    try {
      assert.deepEqual(database.prepare('PRAGMA foreign_key_check').all(), []);
      assert.equal(
        database.prepare("SELECT value FROM metadata WHERE key = 'synthetic'").get().value,
        'true',
      );
    } finally {
      database.close();
    }
  }
  await assert.rejects(buildDatabases({ seed: 42, locale: 'es', outputDir, reviewer }), {
    code: 'EEXIST',
  });
});

test('a low-confidence Jev opinion requires review despite a credible choice', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'synthetic-databases-review-'));
  const manifest = await buildDatabases({
    seed: 19,
    locale: 'fr',
    outputDir: join(parent, 'run'),
    reviewer: async () => ({
      model: 'jev-1.13.0',
      choice: 'credible',
      confidence: 0.42,
      probabilities: { credible: 0.61, review: 0.11, implausible: 0.28 },
    }),
  });
  assert.ok(manifest.reports.every((report) => report.status === 'review'));
});
