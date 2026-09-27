import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { analyzeMachineData } from '../packages/machine-data/src/index.js';
import { prepareSupplierResponse } from '../packages/supplier-evidence/src/index.js';
import { runHandoverDrill } from '../packages/handover-drill/src/index.js';

const fixture = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
const asOf = '2026-09-27T00:00:00Z';

test('machine data: two authorized formats normalize units and expose provenance and gaps', async () => {
  const input = await fixture('packages/machine-data/fixtures/two-machines.json');
  for (const locale of ['fr', 'en', 'es']) {
    const report = analyzeMachineData(input, { locale, asOf });
    assert.equal(report.records.length, 6);
    assert.equal(report.issues.filter((issue) => issue.code === 'gap').length, 2);
    assert.equal(report.records.find((row) => row.metric === 'temperature').value, 20);
    assert.equal(report.records.find((row) => row.metric === 'pressure').value, 120);
    assert.ok(report.records.every((row) => row.provenance.source && row.provenance.originalUnit));
    assert.ok(report.summary.length > 10);
  }
});

test('machine data: expired or out-of-scope access cannot leak readings; duplicates are visible', async () => {
  const input = await fixture('packages/machine-data/fixtures/two-machines.json');
  assert.throws(() => analyzeMachineData(input, { asOf: '2028-01-01T00:00:00Z' }));
  input.feeds[0].rows.push({
    machine: 'press-private',
    time: '2026-09-01T11:00:00Z',
    tempF: 70,
    pressureBar: 1,
  });
  input.feeds[0].rows.push({ ...input.feeds[0].rows[0], tempF: 80 });
  const report = analyzeMachineData(input, { asOf });
  assert.ok(report.issues.some((issue) => issue.code === 'outOfScope'));
  assert.ok(report.issues.some((issue) => issue.code === 'conflict'));
  assert.ok(report.records.every((row) => row.assetId === 'press-7'));
});

test('machine data: invalid values and unsupported units are findings, not invented readings', async () => {
  const input = await fixture('packages/machine-data/fixtures/two-machines.json');
  input.feeds[0].rows[0].tempF = '68';
  input.feeds[0].measurements.pressure.unit = 'psi';
  const report = analyzeMachineData(input, { asOf });
  assert.ok(report.issues.some((issue) => issue.code === 'invalidReading'));
  assert.ok(report.issues.some((issue) => issue.code === 'unsupported'));
  assert.equal(
    report.records.some((row) => row.provenance.originalUnit === 'psi'),
    false,
  );
});

test('supplier evidence: one document is reused, unauthorized claims and tampering are withheld', async () => {
  const baseDir = resolve('packages/supplier-evidence/fixtures');
  const inventory = await fixture('packages/supplier-evidence/fixtures/inventory.json');
  const requests = await fixture('packages/supplier-evidence/fixtures/requests.json');
  for (const locale of ['fr', 'en', 'es']) {
    const first = await prepareSupplierResponse(inventory, requests[0], { baseDir, locale, asOf });
    const second = await prepareSupplierResponse(inventory, requests[1], { baseDir, locale, asOf });
    assert.equal(first.released.length, 2);
    assert.equal(second.released.length, 1);
    assert.equal(second.unresolved[0].code, 'withheld');
    assert.equal(JSON.stringify(second).includes('"value":"FR"'), false);
  }
  const changed = structuredClone(inventory);
  changed.evidence[0].sha256 = '0'.repeat(64);
  const result = await prepareSupplierResponse(changed, requests[0], { baseDir, asOf });
  assert.equal(result.unresolved[0].code, 'invalidEvidence');
  assert.equal(result.released.length, 1);
  changed.evidence[0].sha256 = inventory.evidence[0].sha256;
  changed.evidence[0].path = '../inventory.json';
  const unsafe = await prepareSupplierResponse(changed, requests[0], { baseDir, asOf });
  assert.equal(unsafe.unresolved[0].code, 'invalidEvidence');
  changed.evidence.push({ ...inventory.evidence[0] });
  const duplicate = await prepareSupplierResponse(changed, requests[0], { baseDir, asOf });
  assert.equal(duplicate.unresolved[0].code, 'invalidEvidence');
});

test('supplier evidence: expired or conflicting claims are not released', async () => {
  const baseDir = resolve('packages/supplier-evidence/fixtures');
  const inventory = await fixture('packages/supplier-evidence/fixtures/inventory.json');
  const [request] = await fixture('packages/supplier-evidence/fixtures/requests.json');
  inventory.claims[0].validUntil = '2026-01-01T00:00:00Z';
  let report = await prepareSupplierResponse(inventory, request, { baseDir, asOf });
  assert.equal(report.unresolved[0].code, 'expired');
  inventory.claims[0].validUntil = '2027-12-31T00:00:00Z';
  inventory.claims.push({ ...inventory.claims[0], value: 99 });
  report = await prepareSupplierResponse(inventory, request, { baseDir, asOf });
  assert.equal(report.unresolved[0].code, 'conflict');
});

test('handover drill: clean restore and business check pass in three languages', async () => {
  const baseDir = resolve('packages/handover-drill');
  const config = await fixture('packages/handover-drill/fixtures/demo-config.json');
  process.env.FRONTIER_HANDOVER_SECRET_CANARY = 'must-not-reach-child';
  try {
    for (const locale of ['fr', 'en', 'es']) {
      const report = await runHandoverDrill(config, { baseDir, locale });
      assert.equal(report.passed, true);
      assert.deepEqual(
        report.stages.map((stage) => stage.stage),
        ['copy', 'install', 'restore', 'start', 'business'],
      );
    }
  } finally {
    delete process.env.FRONTIER_HANDOVER_SECRET_CANARY;
  }
});

test('handover drill: an incorrect outcome fails without printing process output', async () => {
  const baseDir = resolve('packages/handover-drill');
  const config = await fixture('packages/handover-drill/fixtures/demo-config.json');
  config.expectedBusiness.count = 3;
  const report = await runHandoverDrill(config, { baseDir, locale: 'fr' });
  assert.equal(report.passed, false);
  assert.equal(report.stages.at(-1).stage, 'business');
  assert.equal(JSON.stringify(report).includes('job-2'), false);
  config.files = ['../README.md'];
  const unsafe = await runHandoverDrill(config, { baseDir, locale: 'es' });
  assert.equal(unsafe.passed, false);
  assert.equal(unsafe.stages[0].stage, 'copy');
  config.files = ['.env'];
  const secretFile = await runHandoverDrill(config, { baseDir, locale: 'en' });
  assert.equal(secretFile.passed, false);
  assert.equal(secretFile.stages[0].stage, 'copy');
  config.files = ['package.json', 'package-lock.json', 'app.js', 'restore.js', 'snapshot.json'];
  config.install = ['node', '-e', 'process.exit(1)'];
  const installFailure = await runHandoverDrill(config, { baseDir, locale: 'fr' });
  assert.equal(installFailure.passed, false);
  assert.equal(installFailure.stages.at(-1).reasonCode, 'INSTALL_FAILED');
});
