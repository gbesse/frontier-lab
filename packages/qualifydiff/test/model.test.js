import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyze, basisFor } from '../src/index.js';
const fixture = () => JSON.parse(readFileSync(new URL('../fixtures/demo.json', import.meta.url)));
test('change propagates only through the affected transitive dependencies', () => {
  const r = analyze(fixture());
  assert.deepEqual(r.changedNodes, ['cure']);
  assert.equal(r.tests[0].state, 'retest');
  assert.deepEqual(r.tests[0].impacts[0].path, ['cure', 'bond']);
  assert.equal(r.tests[1].state, 'retained');
});
test('identical configurations preserve evidence despite revision identifiers', () => {
  const x = fixture();
  x.candidate.nodes = structuredClone(x.baseline.nodes);
  assert.equal(analyze(x).status, 'pass');
});
test('fresh scoped evidence resolves a change and a newer failure supersedes it', () => {
  const x = fixture();
  x.evidence.push({
    id: 'new',
    testId: 'bond-pull',
    basis: basisFor(x.candidate, 'bond-pull'),
    result: 'pass',
    measuredAt: '2026-10-10T00:00:00Z',
  });
  assert.equal(analyze(x).status, 'pass');
  x.evidence.push({
    ...x.evidence.at(-1),
    id: 'failure',
    result: 'fail',
    measuredAt: '2026-10-11T00:00:00Z',
  });
  assert.equal(analyze(x).status, 'fail');
});
test('protocol-only change requires new evidence', () => {
  const x = fixture();
  x.candidate = structuredClone(x.baseline);
  x.candidate.tests[1].protocol.version = '2';
  const t = analyze(x).tests[1];
  assert.equal(t.state, 'retest');
  assert.equal(t.protocolChanged, true);
});
test('removed dependency still explains invalidation via the previous graph', () => {
  const x = fixture();
  x.candidate.nodes.find((n) => n.id === 'cure').dependsOn = [];
  x.candidate.nodes = x.candidate.nodes.filter((n) => n.id !== 'deposit');
  const r = analyze(x);
  assert.ok(r.tests[0].impacts.some((i) => i.node === 'deposit' && i.scope === 'baseline'));
});
test('mandatory test deletion and uncovered changes require review', () => {
  const x = fixture();
  x.candidate.tests.pop();
  assert.ok(analyze(x).findings.some((f) => f.code === 'mandatoryRemoved'));
  x.candidate.nodes.push({ id: 'unmapped', kind: 'operation', dependsOn: [], config: {} });
  assert.deepEqual(analyze(x).untestedChanges, ['unmapped']);
});
test('key and dependency order do not invalidate the same scope', () => {
  const x = fixture();
  x.candidate = structuredClone(x.baseline);
  x.candidate.nodes[2].config = { durationS: 60, temperatureC: 120 };
  assert.equal(analyze(x).status, 'pass');
});
test('cycles, duplicate identifiers, unknown dependencies and future evidence are rejected', () => {
  for (const mutate of [
    (x) => (x.candidate.nodes[0].dependsOn = ['bond']),
    (x) => x.candidate.nodes.push(x.candidate.nodes[0]),
    (x) => (x.candidate.tests[0].dependsOn = ['missing']),
    (x) => (x.evidence[0].measuredAt = '2027-01-01T00:00:00Z'),
  ]) {
    const x = fixture();
    mutate(x);
    assert.throws(() => analyze(x));
  }
});
test('analysis does not mutate the source or the exported evidence basis', () => {
  const x = fixture(),
    before = JSON.stringify(x);
  const r = analyze(x);
  r.tests[0].basis.nodes[0].config.grade = 'other';
  assert.equal(JSON.stringify(x), before);
});
test('timestamp precision is compared numerically, not lexicographically', () => {
  const x = fixture();
  x.evidence[0].measuredAt = '2026-10-11T12:00:00.001Z';
  assert.throws(() => analyze(x));
});
