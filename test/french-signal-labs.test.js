import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { auditLastSignal } from '../packages/last-signal/src/index.js';
import { reconcileRecalls, validGtin } from '../packages/recall-to-receipt/src/index.js';
import { replayDsnCorrections } from '../packages/dsn-replay/src/index.js';
import { witnessWater } from '../packages/water-witness/src/index.js';
import { auditCeeProof } from '../packages/cee-proof-graph/src/index.js';

const run = promisify(execFile);
const fixture = async (name) =>
  JSON.parse(await readFile(resolve('packages', name, 'fixtures/sample.json'), 'utf8'));
const locales = ['fr', 'en', 'es'];

test('last signal treats unknown, conflicting and past closure as unresolved, not safe', async () => {
  const input = await fixture('last-signal');
  for (const locale of locales) {
    const report = auditLastSignal(input, { locale });
    assert.equal(report.findings[0].code, 'DEADLINE_NEAR');
    assert.equal(report.assets[1].dependencies[0].replacementTested, true);
    assert.ok(report.notice.length > 30);
  }
  const unknown = structuredClone(input);
  unknown.closures = [];
  assert.ok(auditLastSignal(unknown).findings.some((item) => item.code === 'UNKNOWN_CLOSURE'));
  const conflict = structuredClone(input);
  conflict.closures.push({ ...conflict.closures[0], effectiveAt: '2026-12-01' });
  assert.ok(auditLastSignal(conflict).findings.some((item) => item.code === 'CONFLICTING_CLOSURE'));
  const past = structuredClone(input);
  past.closures[0].effectiveAt = '2026-09-01';
  assert.ok(auditLastSignal(past).findings.some((item) => item.code === 'OUTAGE_EXPOSURE'));
  past.assets[0].dependencies[0].replacement = {
    installedAt: '2026-10-01',
    testedAt: '2026-09-30',
    result: 'pass',
    evidenceRef: 'bad-test',
  };
  assert.ok(auditLastSignal(past).findings.some((item) => item.code === 'INVALID_TEST'));
  const multi = structuredClone(input);
  multi.assets[0].dependencies[0].replacement = {
    installedAt: '2026-09-01',
    testedAt: '2026-09-03',
    result: 'pass',
    evidenceRef: 'synthetic-test',
  };
  multi.assets[0].dependencies.push({
    technology: 'copper',
    networkOperator: 'sample-fixed',
    area: 'FR-75',
    contractRef: 'second-link',
  });
  const multiReport = auditLastSignal(multi);
  assert.equal(multiReport.assets[0].dependencies[0].replacementTested, true);
  assert.equal(multiReport.assets[0].dependencies[1].replacementTested, false);
  assert.ok(multiReport.findings.some((item) => item.ref === 'assets.0.dependencies.1'));
});

test('recall matcher validates GTIN and separates definite from possible lot matches', async () => {
  const input = await fixture('recall-to-receipt');
  assert.equal(validGtin('1234567890128'), true);
  assert.equal(validGtin('1234567890129'), false);
  for (const locale of locales) {
    const report = reconcileRecalls(input, { locale });
    assert.deepEqual(
      report.matches.map((item) => item.status),
      ['confirmed', 'possible', 'confirmed'],
    );
    assert.equal(JSON.stringify(report).includes('SYNTHETIC-BUYER'), false);
    assert.ok(report.notice.length > 30);
  }
  const outside = structuredClone(input);
  outside.transactions[0].soldAt = '2026-10-01';
  assert.equal(
    reconcileRecalls(outside).matches.filter((item) => item.ref === 'transaction.0').length,
    0,
  );
  const unknown = structuredClone(input);
  unknown.recalls[0].lotCodes = null;
  assert.ok(reconcileRecalls(unknown).matches.every((item) => item.status === 'possible'));
  const bad = structuredClone(input);
  bad.transactions[0].gtin = '1234567890129';
  assert.throws(() => reconcileRecalls(bad));
});

test('DSN replay is local, redacted and catches double corrections and post-substitution re-emission', async () => {
  const input = await fixture('dsn-replay');
  for (const locale of locales) {
    const report = replayDsnCorrections(input, { locale });
    assert.ok(report.findings.some((item) => item.code === 'DOUBLE_CORRECTION_RISK'));
    assert.ok(report.findings.some((item) => item.code === 'POST_SUBSTITUTION_REEMISSION'));
    assert.equal(JSON.stringify(report).includes('SYNTHETIC-EMPLOYEE'), false);
    assert.equal(JSON.stringify(report).includes('200000'), false);
  }
  const unresolved = structuredClone(input);
  unresolved.cases[1].proposedDeltaCents = null;
  assert.ok(replayDsnCorrections(unresolved).findings.some((item) => item.code === 'UNRESOLVED'));
  const mismatch = structuredClone(input);
  mismatch.cases[1].proposedDeltaCents = '4000';
  assert.ok(
    replayDsnCorrections(mismatch).findings.some((item) => item.code === 'PROPOSAL_MISMATCH'),
  );
  const reuse = structuredClone(input);
  reuse.cases[0].appliedCorrections.push({
    id: 'correction-2',
    deltaCents: '0',
    sourceRef: 'payroll-correction-1',
  });
  assert.ok(replayDsnCorrections(reuse).findings.some((item) => item.code === 'REUSED_CORRECTION'));
});

test('water witness preserves missing, below-limit and measured as distinct states', async () => {
  const input = await fixture('water-witness');
  for (const locale of locales) {
    const report = witnessWater(input, { locale });
    assert.deepEqual(
      report.requests[0].parameters.map((row) => row.state),
      ['quantified', 'below_limit', 'not_measured'],
    );
    assert.equal(report.requests[0].parameters[1].valueNgL, null);
    assert.ok(report.findings.some((item) => item.code === 'UDI_UNKNOWN'));
  }
  const stale = structuredClone(input);
  stale.observations[0].sampledAt = '2025-01-01';
  assert.equal(witnessWater(stale).requests[0].parameters[0].state, 'stale');
  const ambiguous = structuredClone(input);
  ambiguous.links.push({ commune: '75056', udi: 'SYNTHETIC-UDI-2', from: '2020-01-01', to: null });
  assert.ok(witnessWater(ambiguous).findings.some((item) => item.code === 'UDI_AMBIGUOUS'));
  const unrepresentative = structuredClone(input);
  unrepresentative.observations[0].representative = false;
  assert.ok(
    witnessWater(unrepresentative).findings.some((item) => item.code === 'ONLY_UNREPRESENTATIVE'),
  );
  const contradictory = structuredClone(input);
  contradictory.observations.push({
    ...contradictory.observations[0],
    id: 'sample-conflict',
    valueNgL: '9.000',
  });
  assert.equal(witnessWater(contradictory).requests[0].parameters[0].state, 'conflicting');
  assert.ok(
    witnessWater(contradictory).findings.some((item) => item.code === 'MEASUREMENT_CONFLICT'),
  );
});

test('CEE graph is date-versioned and does not silently accept missing or reused proofs', async () => {
  const input = await fixture('cee-proof-graph');
  for (const locale of locales) {
    const report = auditCeeProof(input, { locale });
    assert.deepEqual(
      report.findings.map((item) => item.code),
      ['EVIDENCE_MISSING', 'EVIDENCE_TIMING', 'EVIDENCE_REUSED'],
    );
    assert.equal(JSON.stringify(report).includes('12345678901234'), false);
    assert.ok(report.notice.length > 30);
  }
  const noRge = structuredClone(input);
  noRge.qualifications = [];
  assert.ok(auditCeeProof(noRge).findings.some((item) => item.code === 'RGE_MISSING'));
  const noRule = structuredClone(input);
  noRule.rules = [];
  assert.ok(auditCeeProof(noRule).findings.some((item) => item.code === 'RULE_MISSING'));
  const conflict = structuredClone(input);
  conflict.rules.push({ ...conflict.rules[0], validFrom: '2026-02-01' });
  assert.ok(auditCeeProof(conflict).findings.some((item) => item.code === 'RULE_CONFLICT'));
});

test('all five CLIs emit localized demos', async () => {
  for (const name of [
    'last-signal',
    'recall-to-receipt',
    'dsn-replay',
    'water-witness',
    'cee-proof-graph',
  ]) {
    const summaries = [];
    for (const locale of locales) {
      const { stdout } = await run(process.execPath, [
        resolve('packages', name, 'bin/cli.js'),
        'demo',
        `--locale=${locale}`,
      ]);
      const report = JSON.parse(stdout);
      assert.equal(report.locale, locale);
      summaries.push(report.summary);
    }
    assert.equal(new Set(summaries).size, 3);
  }
});
