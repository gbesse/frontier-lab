import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { runPicsExercise } from '../packages/pics-stress-lab/src/index.js';

const exec = promisify(execFile);
const fixture = async () =>
  JSON.parse(await readFile(resolve('packages/pics-stress-lab/fixtures/sample.json'), 'utf8'));
const cli = resolve('packages/pics-stress-lab/bin/cli.js');

test('six-commune exercise compares a clean baseline with conflicting failures in FR/EN/ES', async () => {
  const input = await fixture();
  for (const locale of ['fr', 'en', 'es']) {
    const report = runPicsExercise(input, { locale });
    assert.equal(report.locale, locale);
    assert.equal(report.runs[0].findings.length, 0);
    assert.equal(report.runs[0].unmetUnitMinutes, 0);
    assert.equal(report.runs[1].unmetUnitMinutes, 360);
    assert.equal(report.runs[1].conflictMinutes, 60);
    assert.equal(report.runs[1].deltaUnmetUnitMinutes, 360);
    assert.ok(report.runs[1].findings.some((row) => row.code === 'CAPACITY_CONFLICT'));
    assert.ok(report.runs[1].findings.some((row) => row.code === 'RESOURCE_UNAVAILABLE'));
    assert.ok(report.runs[1].findings.some((row) => row.code === 'AUTHORIZATION_UNDOCUMENTED'));
    assert.ok(report.notice.length > 100);
    assert.match(report.inputSha256, /^[a-f0-9]{64}$/);
  }
  const report = runPicsExercise(input);
  const unmetE = report.runs[1].findings.filter((row) => row.ref === 'demands.d-e');
  assert.equal(unmetE.length, 1);
  assert.equal(unmetE[0].from, '2026-10-09T08:00:00Z');
  assert.equal(unmetE[0].to, '2026-10-09T10:00:00Z');
});

test('half-open windows avoid a false overlap at a handover', async () => {
  const input = await fixture();
  const baseline = runPicsExercise(input).runs[0];
  assert.equal(baseline.conflictMinutes, 0);
  assert.equal(baseline.unmetUnitMinutes, 0);
  const overlap = structuredClone(input);
  overlap.runs[0].assignments[2].from = '2026-10-09T09:30:00Z';
  overlap.demands[2].from = '2026-10-09T09:30:00Z';
  const report = runPicsExercise(overlap);
  assert.equal(report.runs[0].conflictMinutes, 30);
  assert.ok(report.runs[0].findings.some((row) => row.ref === 'demands.d-a'));
  assert.ok(report.runs[0].findings.some((row) => row.ref === 'demands.d-b'));
  assert.ok(report.runs[0].findings.some((row) => row.ref === 'demands.d-c'));
});

test('missing release, incompatible resource and out-of-window assignment never count as coverage', async () => {
  const input = await fixture();
  delete input.runs[0].assignments[1].authorizationRef;
  input.runs[0].assignments[2].resourceId = 'bus-pool';
  input.runs[0].assignments[2].authorizedBy = 'SYNTHETIC-D';
  input.runs[0].assignments[4].to = '2026-10-09T10:30:00Z';
  const report = runPicsExercise(input).runs[0];
  for (const code of ['AUTHORIZATION_UNDOCUMENTED', 'KIND_MISMATCH', 'OUTSIDE_DEMAND'])
    assert.ok(report.findings.some((row) => row.code === code));
  assert.ok(report.unmetUnitMinutes >= 360);
});

test('fully failed resources and unassigned demand are explicitly unresolved', async () => {
  const input = await fixture();
  input.runs[0].failures.push({
    resourceId: 'pump-pool',
    lostCapacity: 2,
    from: '2026-10-09T08:00:00Z',
    to: '2026-10-09T10:00:00Z',
  });
  input.runs[0].assignments.pop();
  const run = runPicsExercise(input).runs[0];
  assert.ok(run.findings.some((row) => row.code === 'RESOURCE_UNAVAILABLE'));
  assert.ok(run.findings.some((row) => row.ref === 'demands.d-f'));
  assert.equal(run.unmetUnitMinutes, 360);
});

test('malformed IDs, UTC dates and overlapping injections are rejected in all locales', async () => {
  const input = await fixture();
  for (const locale of ['fr', 'en', 'es']) {
    const duplicate = structuredClone(input);
    duplicate.resources[1].id = duplicate.resources[0].id;
    assert.throws(() => runPicsExercise(duplicate, { locale }));
    const date = structuredClone(input);
    date.demands[0].to = '2026-10-09T10:00:00+02:00';
    assert.throws(() => runPicsExercise(date, { locale }));
    const injection = structuredClone(input);
    injection.runs[1].failures.push({
      resourceId: 'pump-pool',
      lostCapacity: 1,
      from: '2026-10-09T09:30:00Z',
      to: '2026-10-09T10:30:00Z',
    });
    assert.throws(() => runPicsExercise(injection, { locale }));
  }
});

test('CLI works in three languages and never overwrites a report', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pics-stress-test-'));
  try {
    const reports = [];
    for (const locale of ['fr', 'en', 'es']) {
      const demo = await exec(process.execPath, [cli, 'demo', `--locale=${locale}`]);
      reports.push(JSON.parse(demo.stdout));
    }
    assert.equal(new Set(reports.map((row) => row.notice)).size, 3);
    const path = join(directory, 'report.json');
    await exec(process.execPath, [
      cli,
      'analyze',
      resolve('packages/pics-stress-lab/fixtures/sample.json'),
      path,
      '--locale=en',
    ]);
    assert.equal(JSON.parse(await readFile(path, 'utf8')).locale, 'en');
    assert.equal((await stat(path)).mode & 0o777, 0o600);
    await assert.rejects(() =>
      exec(process.execPath, [
        cli,
        'analyze',
        resolve('packages/pics-stress-lab/fixtures/sample.json'),
        path,
        '--locale=en',
      ]),
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
