import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyze } from '../src/index.js';
const fixture = () => JSON.parse(readFileSync(new URL('../fixtures/demo.json', import.meta.url)));
test('profiles distinguish direct, substituted, expired and impossible routes', () => {
  assert.deepEqual(
    analyze(fixture()).profiles.map((f) => f.state),
    ['compatible', 'adaptation', 'unknown', 'incompatible'],
  );
});
test('tightening precision removes the compatible route', () => {
  const x = fixture();
  for (const r of x.requirements) r.maxErrorUm = 1;
  assert.equal(analyze(x).status, 'fail');
});
test('multiple capabilities cannot combine independent bounds to satisfy one step', () => {
  const x = fixture();
  x.fabs = x.fabs.slice(0, 1);
  const a = x.fabs[0].capabilities[0];
  a.range.max = 100;
  const b = structuredClone(a);
  b.id = 'wide-but-inaccurate';
  b.maxErrorUm = 20;
  b.range.max = 180;
  x.fabs[0].capabilities.push(b);
  assert.equal(analyze(x).profiles[0].state, 'incompatible');
});
test('an incomplete profile never proves the absence of a route', () => {
  const x = fixture();
  x.fabs = x.fabs.slice(3);
  x.fabs[0].complete = false;
  assert.equal(analyze(x).profiles[0].state, 'unknown');
});
test('no unit conversion is guessed', () => {
  const x = fixture();
  x.fabs = x.fabs.slice(0, 1);
  x.fabs[0].capabilities[0].range.unit = 'K';
  assert.equal(analyze(x).status, 'inconclusive');
});
test('calibration not yet valid, unqualified or absent produces unknown', () => {
  for (const mutate of [
    (c) => (c.evidence = null),
    (c) => (c.evidence.qualified = false),
    (c) => (c.evidence.validFrom = '2026-11-01T00:00:00Z'),
  ]) {
    const x = fixture();
    x.fabs = x.fabs.slice(0, 1);
    mutate(x.fabs[0].capabilities[0]);
    assert.equal(analyze(x).profiles[0].state, 'unknown');
  }
});
test('expired alternatives do not establish an adaptation route', () => {
  const x = fixture();
  x.fabs = x.fabs.slice(1, 2);
  x.fabs[0].capabilities[0].evidence = null;
  assert.notEqual(analyze(x).profiles[0].state, 'adaptation');
});
test('exact valid option wins over an invalid duplicate and adaptation', () => {
  const x = fixture();
  const c = structuredClone(x.fabs[0].capabilities[0]);
  c.id = 'expired';
  c.evidence = null;
  x.fabs[0].capabilities.unshift(c);
  assert.equal(analyze(x).profiles[0].steps[0].capabilityId, 'A-deposit');
});
test('invalid range, duplicate identifiers and negative tolerance are rejected', () => {
  for (const mutate of [
    (x) => (x.requirements[0].maxErrorUm = -1),
    (x) => (x.requirements[0].range.min = 200),
    (x) => x.fabs[0].capabilities.push(x.fabs[0].capabilities[0]),
  ]) {
    const x = fixture();
    mutate(x);
    assert.throws(() => analyze(x));
  }
});
