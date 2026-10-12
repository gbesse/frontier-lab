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
import { evaluateDesign, optimizePlate, channelSvg } from '../src/index.js';
test('symmetric hydraulic zones split total flow equally despite unequal heat loads', () => {
  const d = evaluateDesign(demo, [4, 4, 4]);
  assert.ok(d.feasible);
  for (const z of d.zones) assert.ok(Math.abs(z.flowMlMin - 100) < 1e-9);
  assert.ok(Math.abs(d.zones.reduce((s, z) => s + z.flowMlMin, 0) - 300) < 1e-9);
  assert.ok(d.zones[1].estimatedWallC > d.zones[0].estimatedWallC);
});
test('pump power is pressure times total flow in SI units', () => {
  const d = evaluateDesign(demo, [4, 4, 4]);
  assert.ok(Math.abs(d.hydraulicPumpW - (d.pressurePa * 300e-6) / 60) < 1e-12);
});
test('fluid outlet rise conserves heat under constant water properties', () => {
  const d = evaluateDesign(demo, [4, 8, 4]);
  d.zones.forEach((z, i) => {
    const heat = ((z.outletC - demo.inletC) * 997 * 4180 * z.flowMlMin * 1e-6) / 60;
    assert.ok(Math.abs(heat - demo.zones[i].powerW) < 1e-9);
  });
});
test('catalogue respects feature width, laminar validity and pumping budget', () => {
  const d = evaluateDesign(demo, [64, 64, 64]);
  assert.equal(d.feasible, false);
  assert.deepEqual(d.reasons, ['featureLimit']);
  const low = optimizePlate({ ...demo, maxPumpW: 1e-10 });
  assert.equal(low.best, null);
  const high = evaluateDesign({ ...demo, flowMlMin: 10000 }, [2, 2, 2]);
  assert.ok(high.reasons.includes('laminarLimit'));
});
test('Pareto set is feasible and no feasible candidate dominates it', () => {
  const r = optimizePlate(demo);
  assert.ok(r.best);
  for (const d of r.pareto) {
    assert.ok(d.feasible);
    assert.ok(
      !r.designs.some(
        (o) =>
          o.feasible &&
          o.maxWallC <= d.maxWallC &&
          o.hydraulicPumpW <= d.hydraulicPumpW &&
          (o.maxWallC < d.maxWallC || o.hydraulicPumpW < d.hydraulicPumpW),
      ),
    );
  }
});
test('temperature increases with heat, channel SVG contains no user-supplied markup', () => {
  const a = evaluateDesign(demo, [4, 4, 4]);
  const x = clone();
  x.zones[1].powerW = 160;
  x.zones[1].id = '<script>bad</script>';
  const b = evaluateDesign(x, [4, 4, 4]);
  assert.ok(b.maxWallC > a.maxWallC);
  assert.ok(!channelSvg(x, b).includes('<script>'));
});
test('reports localize without changing numerical results and invalid physics fails', () => {
  assert.deepEqual(
    optimizePlate(demo, { locale: 'en' }).designs,
    optimizePlate(demo, { locale: 'es' }).designs,
  );
  for (const patch of [
    { flowMlMin: -1 },
    { conductivityWmK: Infinity },
    { plateWidthMm: 0 },
    { inletC: 90 },
  ])
    assert.throws(() => optimizePlate({ ...demo, ...patch }));
});
