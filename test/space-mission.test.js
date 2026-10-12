import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  runMission,
  simulate,
  orchestrate,
  validateAutonomy,
} from '../packages/space-mission-lab/src/index.js';
import { messages } from '../packages/space-mission-lab/src/i18n.js';
import { createStudio } from '../studio/server.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const fixture = JSON.parse(
  readFileSync(
    new URL('../packages/space-mission-lab/fixtures/sample.json', import.meta.url),
    'utf8',
  ),
);
const sample = () => structuredClone(fixture);
test('mission plan executes all objectives on both vehicles with stable replay and no mutation', () => {
  const mission = sample(),
    before = structuredClone(mission),
    a = runMission(mission),
    b = runMission(mission);
  assert.deepEqual(a, b);
  assert.deepEqual(mission, before);
  assert.equal(a.replay.safe, true);
  assert.equal(a.replay.completed.length, 5);
  assert.equal(new Set(a.plan.schedule.map((item) => item.vehicleId)).size, 2);
  assert.equal(a.validation.passed, 7);
  assert.equal(a.validation.exhaustive, false);
});
for (const [kind, code] of [
  ['link-outage', 'CONTACT'],
  ['low-power', 'POWER'],
  ['sensor-stale', 'SENSOR'],
]) {
  test(`${kind}: guards block commands and the comparison exposes ${code}`, () => {
    const mission = sample(),
      fault = { kind, start: 0 };
    const protectedRun = runMission(mission, { fault });
    assert.equal(protectedRun.replay.safe, true);
    assert.ok(
      protectedRun.replay.events.some(
        (event) => event.status === 'blocked' && event.reasons.includes(code),
      ),
    );
    assert.ok(protectedRun.replay.completed.length < mission.tasks.length);
    const comparison = runMission(mission, { fault, policy: 'unguarded' });
    assert.equal(comparison.replay.safe, false);
    assert.ok(comparison.replay.findings.some((finding) => finding.code === code));
    assert.ok(comparison.validation.passed < comparison.validation.total);
    const sources = new Set(
      [...comparison.replay.events, ...comparison.replay.telemetry].map((item) => item.id),
    );
    for (const alert of comparison.assistant.alerts)
      for (const source of alert.sourceIds) assert.ok(sources.has(source));
    assert.equal(comparison.assistant.proposal.automaticallyApplied, false);
    const preview = simulate(mission, comparison.assistant.proposal.schedule, { fault });
    assert.ok(preview.safe);
    assert.equal(preview.completed.length, comparison.assistant.proposal.schedule.length);
  });
}
test('allocation rejects storage overflow and requires an entire contact window', () => {
  const mission = sample();
  mission.tasks = [mission.tasks[0]];
  mission.tasks[0].vehicleIds = ['LUNA-A'];
  mission.vehicles[0].storageCapacityMb = 20;
  assert.equal(orchestrate(mission).schedule.length, 0);
  const replay = simulate(mission, [
    { taskId: mission.tasks[0].id, vehicleId: 'LUNA-A', start: 0 },
  ]);
  assert.deepEqual(replay.events[0].reasons, ['STORAGE']);
  const radio = sample();
  radio.tasks = [radio.tasks.find((task) => task.id === 'downlink-a')];
  radio.vehicles[0].storageMb = 30;
  const boundary = [{ taskId: 'downlink-a', vehicleId: 'LUNA-A', start: 6 }];
  assert.ok(simulate(radio, boundary).events[0].reasons.includes('CONTACT'));
});
test('occupancy blocks overlapping actions and guards cannot hide idle power failures', () => {
  const mission = sample();
  mission.tasks[1].vehicleIds = ['LUNA-A'];
  const replay = simulate(mission, [
    { taskId: 'observe-pole', vehicleId: 'LUNA-A', start: 0 },
    { taskId: 'observe-crater', vehicleId: 'LUNA-A', start: 1 },
  ]);
  assert.ok(replay.events[1].reasons.includes('CONFLICT'));
  const idle = sample();
  idle.tasks = [];
  idle.vehicles[0].batteryWh = 15;
  idle.vehicles[0].sunlight = [];
  assert.equal(simulate(idle, []).safe, false);
  assert.equal(validateAutonomy(idle, []).cases[0].passed, false);
});
test('faults respect vehicle scope and start slot', () => {
  const mission = sample(),
    plan = orchestrate(mission);
  const fault = { kind: 'sensor-stale', vehicleId: 'LUNA-A', start: 3 };
  const replay = simulate(mission, plan.schedule, { fault });
  assert.equal(replay.events.find((event) => event.taskId === 'observe-pole').status, 'completed');
  assert.equal(
    replay.events.find((event) => event.taskId === 'observe-crater').status,
    'completed',
  );
  assert.equal(replay.events.find((event) => event.taskId === 'observe-ridge').status, 'blocked');
});
test('invalid inputs, unknown options, duplicate commands and impossible times are rejected', () => {
  for (const mutation of [
    (m) => (m.horizonSlots = 1e8),
    (m) => (m.vehicles[0].batteryWh = NaN),
    (m) => (m.tasks[0].energyWh = -1),
    (m) => (m.tasks[0].duration = 0),
    (m) => (m.tasks[0].vehicleIds = ['unknown']),
    (m) => m.vehicles.push(m.vehicles[0]),
  ]) {
    const mission = sample();
    mutation(mission);
    assert.throws(() => runMission(mission));
  }
  for (const settings of [
    { locale: 'de' },
    { policy: 'unknown' },
    { fault: { kind: 'unknown' } },
    { fault: { kind: 'low-power', vehicleId: 'missing' } },
    { fault: { kind: 'low-power', start: 48 } },
  ])
    assert.throws(() => runMission(sample(), settings));
  const command = { taskId: 'observe-pole', vehicleId: 'LUNA-A', start: 0 };
  assert.throws(() => simulate(sample(), [command, command]));
  assert.throws(() => simulate(sample(), [{ ...command, start: 4 }]));
});
test('reports and CLI are trilingual without changing identifiers or locale-independent trace hashes', () => {
  const hashes = [];
  for (const locale of ['fr', 'en', 'es']) {
    const report = runMission(sample(), { locale });
    hashes.push(report.replay.traceSha256);
    assert.equal(report.missionId, fixture.id);
    assert.equal(report.locale, locale);
    assert.notEqual(report.notice, '');
    const cli = JSON.parse(
      execFileSync(
        process.execPath,
        ['packages/space-mission-lab/bin/cli.js', 'demo', `--locale=${locale}`],
        { encoding: 'utf8' },
      ),
    );
    assert.deepEqual(cli, report);
  }
  assert.equal(new Set(hashes).size, 1);
  for (const translations of Object.values(messages)) {
    assert.equal(translations.length, 3);
    const placeholders = (value) =>
      [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    for (const value of translations) {
      assert.ok(value.trim());
      assert.deepEqual(placeholders(value), placeholders(translations[0]));
    }
  }
});
test('mission API preserves existing local authentication and returns localized input errors', async () => {
  const storageDir = await mkdtemp(join(tmpdir(), 'space-api-'));
  const studio = await createStudio({ port: 0, storageDir });
  try {
    const origin = await studio.listen();
    const { mission, token } = await (await fetch(`${origin}/api/space/scenario`)).json();
    const noToken = await fetch(`${origin}/api/space/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mission }),
    });
    assert.equal(noToken.status, 403);
    for (const locale of ['fr', 'en', 'es']) {
      const response = await fetch(`${origin}/api/space/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-studio-token': token },
        body: JSON.stringify({ mission, locale }),
      });
      assert.equal(response.status, 200);
      assert.equal((await response.json()).locale, locale);
      const invalid = await fetch(`${origin}/api/space/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-studio-token': token },
        body: JSON.stringify({ mission: {}, locale }),
      });
      assert.equal(invalid.status, 422);
      assert.equal((await invalid.json()).error.code, 'INVALID_MISSION');
    }
  } finally {
    await studio.close();
    await rm(storageDir, { recursive: true, force: true });
  }
});
