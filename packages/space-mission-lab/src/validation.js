import { checkOptions } from './model.js';
import { simulate } from './simulation.js';
import { say } from './i18n.js';

export function validateAutonomy(mission, schedule, options = {}) {
  const { locale, policy } = checkOptions(mission, options);
  const faults = [
    { kind: 'nominal', start: 0 },
    ...mission.vehicles.flatMap((vehicle) =>
      ['link-outage', 'low-power', 'sensor-stale'].map((kind) => ({
        kind,
        vehicleId: vehicle.id,
        start: 0,
      })),
    ),
  ];
  const cases = faults.map((fault) => {
    const replay = simulate(mission, schedule, { locale, policy, fault });
    return {
      fault,
      label: say(fault.kind, locale),
      passed: replay.safe,
      completed: replay.completed.length,
      objectives: mission.tasks.length,
      codes: [...new Set(replay.findings.map((finding) => finding.code))],
      traceSha256: replay.traceSha256,
    };
  });
  const passed = cases.filter((item) => item.passed).length;
  return {
    method: 'declared-fault-matrix',
    exhaustive: false,
    policy,
    passed,
    total: cases.length,
    message: say('validation', locale, { passed, total: cases.length }),
    cases,
  };
}
