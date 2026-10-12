import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyze, operationBasis } from '../src/index.js';
const fixture = () => JSON.parse(readFileSync(new URL('../fixtures/demo.json', import.meta.url)));
const inspect = (x, outcome) =>
  x.journal.push({
    id: 'inspection',
    seq: 7,
    type: 'inspection',
    operationId: 'deposit',
    attemptId: 'deposit-1',
    physicalOutcome: outcome,
  });
test('lost acknowledgement prevents a blind replay of deposition', () => {
  const r = analyze(fixture());
  assert.equal(r.plan[1].state, 'inspect');
  assert.equal(r.plan[1].action, 'inspect');
  assert.equal(r.plan[2].state, 'blocked');
});
test('inspection proving application prevents replay and releases downstream work', () => {
  const x = fixture();
  inspect(x, 'applied');
  const r = analyze(x);
  assert.equal(r.plan[1].state, 'done');
  assert.equal(r.plan[2].state, 'readyOperation');
});
test('inspection proving absence permits a bounded new attempt', () => {
  const x = fixture();
  inspect(x, 'not_applied');
  assert.equal(analyze(x).plan[1].action, 'new_attempt');
  x.journal.push({
    id: 'retry',
    seq: 8,
    type: 'intent',
    operationId: 'deposit',
    attemptId: 'deposit-2',
    idempotencyKey: 'deposit-2-key',
    commandBasis: operationBasis(x.operations[1]),
  });
  assert.equal(analyze(x).plan[1].state, 'inspect');
});
test('failed execution does not imply absence of a physical effect', () => {
  const x = fixture();
  x.journal.at(-1).type = 'failed';
  assert.equal(analyze(x).plan[1].state, 'inspect');
});
test('idempotent contract permits only replay using the same key', () => {
  const x = fixture();
  x.operations[1].retryMode = 'idempotent';
  const p = analyze(x).plan[1];
  assert.equal(p.action, 'replay_same_key');
  assert.equal(p.idempotencyKey, 'part-001-deposit-1');
  x.journal.push({
    id: 'replay',
    seq: 7,
    type: 'intent',
    operationId: 'deposit',
    attemptId: 'deposit-2',
    idempotencyKey: 'wrong-key',
    commandBasis: operationBasis(x.operations[1]),
  });
  assert.throws(() => analyze(x));
  x.journal.at(-1).idempotencyKey = p.idempotencyKey;
  assert.doesNotThrow(() => analyze(x));
});
test('exhausted attempts and never-retry operations need manual review', () => {
  for (const mutate of [
    (x) => (x.operations[1].maxAttempts = 1),
    (x) => (x.operations[1].retryMode = 'never'),
  ]) {
    const x = fixture();
    mutate(x);
    inspect(x, 'not_applied');
    assert.equal(analyze(x).status, 'fail');
  }
});
test('late completion after interruption resolves the unknown outcome', () => {
  const x = fixture();
  x.journal.push({
    id: 'late',
    seq: 7,
    type: 'completed',
    operationId: 'deposit',
    attemptId: 'deposit-1',
  });
  assert.equal(analyze(x).plan[1].state, 'done');
});
test('out-of-order events, reused keys, premature dependencies and duplicate ids are rejected', () => {
  for (const mutate of [
    (x) => (x.journal.at(-1).seq = 3),
    (x) => (x.journal[3].idempotencyKey = x.journal[0].idempotencyKey),
    (x) => (x.journal[0].operationId = 'cure'),
    (x) => (x.journal.at(-1).id = x.journal[0].id),
  ]) {
    const x = fixture();
    mutate(x);
    assert.throws(() => analyze(x));
  }
});
test('unknown inspection keeps the operation blocked from replay', () => {
  const x = fixture();
  inspect(x, 'unknown');
  assert.equal(analyze(x).plan[1].state, 'inspect');
});

test('a changed payload cannot be replayed under an old command basis', () => {
  const x = fixture();
  x.operations[1].parameters.thicknessUm = 80;
  assert.throws(() => analyze(x));
});
