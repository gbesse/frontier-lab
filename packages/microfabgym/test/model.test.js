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
import { MicroFabEnvironment, benchmarkPolicies, runPolicy, baselinePolicy } from '../src/index.js';
test('identical seed repeats all outcomes and policies have the same latent episodes', () => {
  assert.deepEqual(benchmarkPolicies(demo), benchmarkPolicies(demo));
  const a = new MicroFabEnvironment(demo),
    b = new MicroFabEnvironment(demo);
  a.reset(4);
  b.reset(4);
  b.step({ type: 'measure' });
  a.step({ type: 'deposit', amountUm: 10 });
  b.step({ type: 'deposit', amountUm: 10 });
  assert.equal(a.actual, b.actual);
});
test('observations and policy callback never disclose latent thickness or gain', () => {
  const env = new MicroFabEnvironment(demo);
  const o = env.reset();
  assert.equal(o.measuredUm, null);
  assert.equal('actual' in o, false);
  assert.equal('gain' in o, false);
  runPolicy(demo, (obs, step) => {
    assert.equal('actual' in obs, false);
    return step === 0 ? { type: 'deposit', amountUm: 20 } : { type: 'finish' };
  });
});
test('closed-loop baselines improve synthetic yield at additional cost', () => {
  const r = benchmarkPolicies(demo);
  assert.ok(r.policies[2].successRate > r.policies[0].successRate);
  assert.ok(r.policies[2].meanCost < r.policies[1].meanCost);
  assert.ok(r.policies[2].meanCost > r.policies[0].meanCost);
});
test('budget cannot be exceeded and terminal environments refuse more actions', () => {
  const env = new MicroFabEnvironment({ ...demo, budget: 2 });
  env.reset();
  env.step({ type: 'deposit', amountUm: 10 });
  const r = env.step({ type: 'measure' });
  assert.equal(r.truncated, true);
  assert.equal(env.cost, 2);
  assert.throws(() => env.step({ type: 'finish' }));
});
test('action bounds and invalid configs fail before mutation', () => {
  const env = new MicroFabEnvironment(demo);
  env.reset();
  for (const a of [
    { type: 'deposit', amountUm: -1 },
    { type: 'deposit', amountUm: 1000 },
    { type: 'unexpected' },
  ])
    assert.throws(() => env.step(a));
  assert.equal(env.actual, 0);
  for (const c of [
    { seed: 1.2 },
    { episodes: 0 },
    { sensorSigmaUm: Infinity },
    { toleranceUm: 20 },
  ])
    assert.throws(() => benchmarkPolicies({ ...demo, ...c }));
});
test('final quality is evaluated against latent state instead of last sensor reading', () => {
  const r = runPolicy(demo, baselinePolicy('openLoop', demo));
  assert.equal(r.measurements, 0);
  assert.equal(r.success, Math.abs(r.errorUm) <= demo.toleranceUm);
});
