import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyze, fisherExact } from '../src/index.js';
const fixture = () => JSON.parse(readFileSync(new URL('../fixtures/demo.json', import.meta.url)));
test('part histories reconstruct durations and classify observed intervals', () => {
  const r = analyze(fixture());
  assert.equal(r.cohortSize, 16);
  assert.equal(r.traces.filter((t) => t.outcome === 'pass').length, 8);
  assert.equal(r.traces.filter((t) => t.outcome === 'fail').length, 8);
  assert.equal(r.rows[0].value, 65000);
});
test('Fisher exact reproduces a known contingency-table result', () => {
  assert.ok(Math.abs(fisherExact(1, 9, 11, 3) - 0.0027594561852200836) < 1e-12);
  assert.equal(fisherExact(0, 0, 0, 0), 1);
  assert.equal(fisherExact(1, 1, 1, 1), 1);
  assert.throws(() => fisherExact(-1, 2, 3, 4));
});
test('confounded lot and recipe produce equal associations without a causal verdict', () => {
  const r = analyze(fixture());
  const lot = r.associations.find((a) => a.key === 'materialLot' && a.value === 'lot-B'),
    recipe = r.associations.find((a) => a.key === 'recipeVersion' && a.value === 'v2');
  assert.equal(lot.riskDifference, 1);
  assert.equal(lot.pValue, recipe.pValue);
  assert.ok(r.findings.some((f) => f.code === 'associationOnly'));
  assert.equal(lot.adjustedPValue, Math.min(1, lot.pValue * r.associations.length));
});
test('missing facts do not enter the unexposed cohort', () => {
  const x = fixture();
  delete x.parts[0].facts.materialLot;
  const a = analyze(x).associations.find((a) => a.key === 'materialLot' && a.value === 'lot-B');
  assert.equal(a.otherPassed, 7);
});
test('incomplete history is excluded rather than interpreted as a good part', () => {
  const x = fixture();
  x.parts[0].events.pop();
  const r = analyze(x);
  assert.equal(r.cohortSize, 15);
  assert.deepEqual(r.excludedParts, ['part-01']);
  assert.equal(r.rows[0].state, 'unknown');
});
test('missing and boundary-overlapping measurements produce inconclusive outcomes', () => {
  for (const mutate of [
    (x) => (x.parts[0].measurements = []),
    (x) => {
      x.parts[0].measurements[0].value = 12;
      x.parts[0].measurements[0].uncertainty95 = 1;
    },
  ]) {
    const x = fixture();
    mutate(x);
    assert.equal(analyze(x).traces[0].outcome, 'inconclusive');
  }
});
test('start before dependencies or non-monotonic time is a trace issue', () => {
  for (const mutate of [
    (x) => (x.parts[0].events[0].operationId = 'cure'),
    (x) => (x.parts[0].events[1].time = '2026-10-10T11:00:00Z'),
  ]) {
    const x = fixture();
    mutate(x);
    assert.equal(analyze(x).traces[0].cohortEligible, false);
  }
});
test('unit mismatch is unknown, not evidence of a failed physical property', () => {
  const x = fixture();
  x.parts[8].measurements[0].unit = 'Pa';
  assert.equal(analyze(x).traces[8].outcome, 'inconclusive');
});
test('unknown requirements, duplicate events and graph cycles are rejected', () => {
  for (const mutate of [
    (x) => (x.parts[0].measurements[0].requirementId = 'missing'),
    (x) => x.parts[0].events.push(x.parts[0].events[0]),
    (x) => (x.operations[0].dependsOn = ['cure']),
  ]) {
    const x = fixture();
    mutate(x);
    assert.throws(() => analyze(x));
  }
});
