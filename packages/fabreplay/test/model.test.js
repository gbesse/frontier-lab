import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { translations, message } from '../src/i18n.js';
const demo = JSON.parse(await readFile(new URL('../fixtures/demo.json', import.meta.url), 'utf8'));
const clone = () => structuredClone(demo);
test('all user copy has FR/EN/ES and identical placeholders', () => {
  for (const [key, values] of Object.entries(translations)) {
    assert.equal(values.length, 3, key);
    for (const value of values) assert.ok(value.trim(), key);
    const placeholders = (v) => [...v.matchAll(/\{(\w+)\}/g)].map((x) => x[1]).sort();
    assert.deepEqual(placeholders(values[0]), placeholders(values[1]), key);
    assert.deepEqual(placeholders(values[0]), placeholders(values[2]), key);
  }
  assert.throws(() => message('notice', 'de'));
});
import {
  compareRevisions,
  summarizeRevision,
  flexureStiffness,
  measurementsFromCsv,
} from '../src/index.js';
test('cantilever dimensional law and t cubed scaling', () => {
  const beam = { youngGpa: 160, lengthUm: 1000, widthUm: 50, thicknessUm: 20 };
  assert.ok(Math.abs(flexureStiffness(beam) - 16) < 1e-10);
  assert.ok(Math.abs(flexureStiffness({ ...beam, thicknessUm: 22 }) / 16 - 1.331) < 1e-10);
});
test('specimen slopes remove zero-offset and use independent specimen count', () => {
  const r = summarizeRevision(demo.revisions[0]);
  assert.equal(r.specimenCount, 3);
  assert.ok(Math.abs(r.meanStiffnessNPerM - 16) < 1e-10);
  assert.ok(Math.abs(r.confidence95NPerM[1] - 16 - (4.303 * 0.1) / Math.sqrt(3)) < 1e-10);
  const duplicate = structuredClone(demo.revisions[0]);
  duplicate.measurements.push(...duplicate.measurements);
  const next = summarizeRevision(duplicate);
  assert.equal(next.specimenCount, 3);
  assert.ok(Math.abs(next.standardErrorNPerM - r.standardErrorNPerM) < 1e-10);
});
test('larger predicted stiffness does not hide measured acceptance failure', () => {
  for (const locale of ['fr', 'en', 'es']) {
    const r = compareRevisions(demo, { locale });
    assert.equal(r.status, 'fail');
    assert.ok(r.candidate.predictedStiffnessNPerM > r.candidate.meanStiffnessNPerM);
    assert.ok(Math.abs(r.changePercent - 9.375) < 1e-9);
    assert.ok(r.differenceConfidence95NPerM[0] > 0);
  }
});
test('calibration changes block attribution and passing CI gate', () => {
  const input = clone();
  input.minimumStiffnessNPerM = 1;
  input.revisions[1].conditions.calibration = 'changed';
  const r = compareRevisions(input);
  assert.equal(r.status, 'inconclusive');
  assert.equal(r.changePercent, null);
  assert.equal(r.differenceConfidence95NPerM, null);
});
test('conditions object order does not change comparability', () => {
  const x = clone();
  x.revisions[1].conditions = Object.fromEntries(
    Object.entries(x.revisions[1].conditions).reverse(),
  );
  assert.equal(compareRevisions(x).comparable, true);
});
test('confidence interval can pass or straddle acceptance target', () => {
  const x = clone();
  x.minimumStiffnessNPerM = 17;
  assert.equal(compareRevisions(x).status, 'pass');
  x.minimumStiffnessNPerM = 17.5;
  assert.equal(compareRevisions(x).status, 'inconclusive');
});
test('malformed CSV is rejected and quoted IDs, CRLF and milli/micro units survive', () => {
  const csv = 'specimen_id,displacement_um,force_mn\r\n"specimen,one",20,0.32\r\n';
  assert.deepEqual(measurementsFromCsv(csv), [
    { specimenId: 'specimen,one', displacementUm: 20, forceMn: 0.32 },
  ]);
  for (const text of [
    'wrong,header\n1,2',
    'specimen_id,displacement_um,force_mn\na,,2',
    'specimen_id,displacement_um,force_mn\n"unterminated,2,3',
  ])
    assert.throws(() => measurementsFromCsv(text));
});
test('nonlinearity, missing metadata and insufficient independent specimens cannot pass', () => {
  const x = clone();
  x.revisions[1].measurements[1].forceMn += 0.4;
  assert.equal(compareRevisions(x).status, 'inconclusive');
  const y = clone();
  delete y.revisions[1].conditions.fixture;
  assert.throws(() => compareRevisions(y));
  const z = clone();
  z.revisions[1].measurements = z.revisions[1].measurements.filter((p) => p.specimenId === 'B-1');
  assert.throws(() => compareRevisions(z));
});
