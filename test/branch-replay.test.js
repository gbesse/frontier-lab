import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { recordScenario, replayScenario, diffPresence, diff } from '@gbesse/branch-lab';
const scenario = JSON.parse(
  await readFile(new URL('../examples/branch-failure.json', import.meta.url)),
);
test('portable receipt replays the complete state/events and expected failure', () => {
  const bundle = recordScenario(scenario),
    verification = replayScenario(JSON.parse(JSON.stringify(bundle)));
  assert.equal(verification.verified, true);
  assert.equal(verification.scenarioPassed, true);
  assert.equal(bundle.report.error.code, 'INJECTED_FAILURE');
});
test('a verified replay is distinct from passing the business assertions', () => {
  const bundle = recordScenario({ steps: [], expected: { confirmedOrders: 1 } });
  assert.equal(replayScenario(bundle).verified, true);
  assert.equal(replayScenario(bundle).scenarioPassed, false);
});
test('changes to fault plan, expectations or report are detected', () => {
  for (const mutate of [
    (b) => (b.scenario.faults.queue_email = 0),
    (b) => (b.scenario.expected.outboxCount = 1),
    (b) => b.report.state.products[0].stock++,
  ]) {
    const bundle = recordScenario(scenario);
    mutate(bundle);
    assert.equal(replayScenario(bundle).verified, false);
  }
});
test('caller mutations cannot change the recorded scenario snapshot', () => {
  const input = structuredClone(scenario),
    bundle = recordScenario(input);
  input.steps[0].args.quantity = 99;
  assert.equal(bundle.scenario.steps[0].args.quantity, 2);
  assert.equal(replayScenario(bundle).verified, true);
});
test('nonportable values are refused instead of hashed with lossy JSON', () => {
  for (const value of [undefined, NaN, Infinity, () => {}, new Date(), [,]])
    assert.throws(() => recordScenario({ steps: [], extra: value }), { code: 'INVALID_REPLAY' });
  const cycle = { steps: [] };
  cycle.self = cycle;
  assert.throws(() => recordScenario(cycle), { code: 'INVALID_REPLAY' });
});

test('presence-aware diffs distinguish absent and null without inherited prototype fields', () => {
  assert.deepEqual(diffPresence({}, { value: null }), [
    { path: '/value', before: null, after: null, beforeExists: false, afterExists: true },
  ]);
  assert.deepEqual(diffPresence({ value: null }, {}), [
    { path: '/value', before: null, after: null, beforeExists: true, afterExists: false },
  ]);
  const value = JSON.parse('{"__proto__":null,"constructor":null,"toString":null}');
  const changes = diffPresence({}, value);
  assert.equal(changes.length, 3);
  assert.ok(changes.every((c) => c.beforeExists === false && c.before === null));
  assert.equal(JSON.parse(JSON.stringify(changes)).length, 3);
  assert.equal(diffPresence({}, { 'a/b~c': 1 })[0].path, '/a~1b~0c');
});
test('legacy diffs keep their shape and replay exposes an unambiguous first mismatch', () => {
  assert.deepEqual(diff({}, { value: 1 }), [{ path: '/value', before: null, after: 1 }]);
  const bundle = recordScenario({ steps: [], expected: { confirmedOrders: 0 } });
  assert.equal(replayScenario(bundle).firstDifference, null);
  delete bundle.report.error;
  const result = replayScenario(bundle);
  assert.equal(result.verified, false);
  assert.equal(result.firstDifference.path, '/error');
  assert.equal(result.firstDifference.beforeExists, false);
  assert.equal(result.firstDifference.afterExists, true);
});
