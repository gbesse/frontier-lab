import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyze } from '../src/index.js';
const fixture = () => JSON.parse(readFileSync(new URL('../fixtures/demo.json', import.meta.url)));
test('optimal subset includes mandatory inspection and respects budget', () => {
  const r = analyze(fixture());
  assert.deepEqual(r.selected, ['electrical', 'pull-test', 'visual']);
  assert.equal(r.measurementCost, 75);
  assert.ok(Math.abs(r.residualLoss - 42) < 1e-9);
  assert.ok(Math.abs(r.totalExpectedCost - 117) < 1e-9);
});
test('mandatory controls are never silently dropped under insufficient budget', () => {
  const x = fixture();
  x.budget = 9;
  const r = analyze(x);
  assert.equal(r.status, 'fail');
  assert.deepEqual(r.unmetMandatory, ['visual']);
  assert.equal(r.totalExpectedCost, null);
});
test('zero defect probability avoids optional spending', () => {
  const x = fixture();
  for (const r of x.risks) r.probability = 0;
  assert.deepEqual(analyze(x).selected, ['visual']);
});
test('perfect free measurement removes all residual loss', () => {
  const x = fixture();
  x.measurements.push({
    id: 'perfect',
    cost: 0,
    mandatory: false,
    detection: x.risks.map((r) => ({ riskId: r.id, sensitivity: 1 })),
  });
  const r = analyze(x);
  assert.equal(r.residualLoss, 0);
  assert.equal(r.measurementCost, 10);
  assert.ok(r.selected.includes('visual'));
});
test('overlapping inspections have diminishing returns', () => {
  const x = fixture();
  x.budget = 1000;
  const r = analyze(x);
  assert.ok(!r.selected.includes('duplicate-pull'));
});
test('no-effect measurement can still be required', () => {
  const x = fixture();
  x.measurements[0].detection = [];
  assert.ok(analyze(x).selected.includes('visual'));
});
test('budget monotonicity applies to the optimized total expected cost', () => {
  const x = fixture();
  let last = Infinity;
  for (const budget of [10, 30, 55, 80, 100, 200]) {
    x.budget = budget;
    const r = analyze(x);
    assert.ok(r.totalExpectedCost <= last + 1e-9);
    last = r.totalExpectedCost;
  }
});
test('negative or fractional budgets, invalid sensitivities and unknown risks are rejected', () => {
  for (const mutate of [
    (x) => (x.budget = -1),
    (x) => (x.budget = 3.5),
    (x) => (x.measurements[0].detection[0].sensitivity = 1.1),
    (x) => (x.measurements[0].detection[0].riskId = 'missing'),
  ]) {
    const x = fixture();
    mutate(x);
    assert.throws(() => analyze(x));
  }
});
test('search refuses unbounded optional catalogs', () => {
  const x = fixture();
  x.measurements = Array.from({ length: 19 }, (_, i) => ({
    id: 'm' + i,
    cost: 1,
    mandatory: false,
    detection: [],
  }));
  assert.throws(() => analyze(x));
});
