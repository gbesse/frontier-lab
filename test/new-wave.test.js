import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { analyzePayeeExceptions } from '../packages/payee-exceptions/src/index.js';
import { analyzeInvoicePath } from '../packages/invoice-path/src/index.js';
import { compareProvenance, probeLocalFiles } from '../packages/provenance-last-mile/src/index.js';
import { analyzePqcCutover } from '../packages/pqc-cutover/src/index.js';

const fixture = async (name) =>
  JSON.parse(await readFile(resolve('packages', name, 'fixtures/sample.json'), 'utf8'));

test('VoP review never overrides bank results or exposes account references in three locales', async () => {
  const input = await fixture('payee-exceptions');
  for (const locale of ['fr', 'en', 'es']) {
    const report = analyzePayeeExceptions(input, { locale });
    assert.equal(report.cases[0].decision, 'bank_reported_match');
    assert.equal(report.cases[1].decision, 'review');
    assert.equal(report.cases[1].knownNameMatch, true);
    assert.equal(report.cases[2].decision, 'review');
    assert.ok(report.cases[2].findings.some((item) => item.code === 'accountConflict'));
    assert.ok(report.summary.length > 10);
    assert.equal(JSON.stringify(report).includes('SYNTHETIC-ACCOUNT'), false);
  }
  input.checks[0].id = input.checks[1].id;
  assert.throws(() => analyzePayeeExceptions(input));
});

test('invoice path preserves provenance and detects missing, unexpected and duplicate events', async () => {
  const input = await fixture('invoice-path');
  for (const locale of ['fr', 'en', 'es']) {
    const report = analyzeInvoicePath(input, { locale });
    assert.equal(report.paths.length, 2);
    assert.ok(report.issues.some((item) => item.code === 'wrongRoute'));
    assert.ok(report.issues.some((item) => item.code === 'missingAccepted'));
    assert.equal(report.paths[0].events[0].source, 'ec-export');
    assert.ok(report.summary.length > 10);
  }
  input.events.push({ ...input.events[0] });
  input.events.push({
    id: 'unknown',
    invoiceId: 'INV-OTHER',
    source: 'fixture',
    status: 'sent',
    at: '2026-09-20T10:00:00Z',
  });
  const report = analyzeInvoicePath(input);
  assert.ok(report.issues.some((item) => item.code === 'duplicateEvent'));
  assert.ok(report.issues.some((item) => item.code === 'unknownInvoice'));
  input.events[0].at = 'invalid';
  assert.throws(() => analyzeInvoicePath(input));
});

test('C2PA stage comparison distinguishes absence, invalidity and legitimate changed labels', async () => {
  const input = await fixture('provenance-last-mile');
  for (const locale of ['fr', 'en', 'es']) {
    const report = compareProvenance(input, { locale });
    assert.equal(report.continuity, false);
    assert.deepEqual(
      report.stages.map((stage) => stage.code),
      ['preserved', 'preserved', 'absent'],
    );
    assert.ok(report.notice.length > 10);
  }
  input.stages[2].validator = { active_manifest: 'new-manifest', validation_state: 'Valid' };
  assert.equal(compareProvenance(input).stages.at(-1).code, 'changed');
  input.stages[2].validator.validation_status = [{ code: 'signature.invalid' }];
  assert.equal(compareProvenance(input).stages.at(-1).code, 'invalidManifest');
  input.stages[2].sha256 = 'not-a-hash';
  assert.throws(() => compareProvenance(input));
});

test('C2PA probe reads two actual local files and delegates validation without download', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'frontier-provenance-test-'));
  const first = join(dir, 'source.bin');
  const second = join(dir, 'published.bin');
  await writeFile(first, 'source');
  await writeFile(second, 'published');
  const called = [];
  const report = await probeLocalFiles([first, second], {
    locale: 'en',
    runValidator: async (file) => {
      called.push(file);
      return {
        active_manifest: file === first ? 'synthetic-manifest' : null,
        validation_state: file === first ? 'Valid' : 'unknown',
      };
    },
  });
  assert.deepEqual(called, [first, second]);
  assert.notEqual(report.stages[0].sha256, report.stages[1].sha256);
  assert.equal(report.stages[1].code, 'absent');
});

test('PQC rehearsal flags observed classical fallback and missing negative test in three locales', async () => {
  const input = await fixture('pqc-cutover');
  for (const locale of ['fr', 'en', 'es']) {
    const report = analyzePqcCutover(input, { locale });
    assert.equal(report.systems.length, 2);
    assert.ok(report.systems[0].findings.some((item) => item.code === 'hybridObserved'));
    assert.ok(report.systems[1].findings.some((item) => item.code === 'classicalFallback'));
    assert.ok(report.systems[1].findings.some((item) => item.code === 'downgradeObserved'));
    assert.ok(report.summary.length > 10);
  }
  input.systems[0].observations.pop();
  assert.ok(
    analyzePqcCutover(input).systems[0].findings.some((item) => item.code === 'missingBroken'),
  );
  input.systems[0].observations.push({
    id: 'bad-lab',
    scenario: 'pq_path_broken',
    success: true,
    offeredGroups: ['X25519MLKEM768'],
    negotiatedGroup: 'X25519MLKEM768',
    evidenceRef: 'synthetic/bad-lab',
  });
  assert.ok(
    analyzePqcCutover(input).systems[0].findings.some(
      (item) => item.code === 'brokenPathSucceeded',
    ),
  );
  input.systems[0].observations[0].negotiatedGroup = 'UNKNOWN-GROUP';
  assert.ok(
    analyzePqcCutover(input).systems[0].findings.some((item) => item.code === 'unexpectedGroup'),
  );
  input.systems[0].observations[0].success = 'yes';
  assert.throws(() => analyzePqcCutover(input));
});
