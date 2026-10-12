import { checkOptions, checkSchedule, hash, inWindow, affected } from './model.js';
import { say } from './i18n.js';

export function simulate(mission, schedule, options = {}) {
  const { locale, policy, fault } = checkOptions(mission, options);
  checkSchedule(mission, schedule, locale);
  const states = new Map(
    mission.vehicles.map((vehicle) => [
      vehicle.id,
      { batteryWh: vehicle.batteryWh, storageMb: vehicle.storageMb, busyUntil: 0 },
    ]),
  );
  const events = [],
    telemetry = [],
    findings = [];
  const violation = (code, vehicleId, slot, sourceId) =>
    findings.push({ code, message: say(code, locale), vehicleId, slot, sourceId });
  for (let slot = 0; slot < mission.horizonSlots; slot++) {
    for (const vehicle of mission.vehicles) {
      const state = states.get(vehicle.id),
        hit = affected(fault, vehicle.id, slot);
      if (hit && fault.kind === 'low-power' && slot === fault.start)
        state.batteryWh = Math.min(
          state.batteryWh,
          vehicle.reserveWh + (mission.horizonSlots - slot) * vehicle.baseLoadWh + 1,
        );
      state.batteryWh =
        Math.min(
          vehicle.batteryCapacityWh,
          state.batteryWh +
            (inWindow(vehicle.sunlight, slot) && !(hit && fault.kind === 'low-power')
              ? vehicle.rechargeWh
              : 0),
        ) - vehicle.baseLoadWh;
      for (const command of schedule.filter(
        (item) => item.vehicleId === vehicle.id && item.start === slot,
      )) {
        const task = mission.tasks.find((item) => item.id === command.taskId),
          reasons = [],
          eventId = `event-${events.length + 1}`;
        if (state.busyUntil > slot) reasons.push('CONFLICT');
        if (state.batteryWh - task.energyWh < vehicle.reserveWh) reasons.push('POWER');
        if (task.type === 'observe' && state.storageMb + task.dataMb > vehicle.storageCapacityMb)
          reasons.push('STORAGE');
        if (task.type === 'observe' && hit && fault.kind === 'sensor-stale') reasons.push('SENSOR');
        if (task.type === 'downlink') {
          if (state.storageMb < task.dataMb) reasons.push('DATA');
          for (let offset = 0; offset < task.duration; offset++) {
            if (
              !inWindow(vehicle.contacts, slot + offset) ||
              (fault.kind === 'link-outage' && affected(fault, vehicle.id, slot + offset))
            ) {
              reasons.push('CONTACT');
              break;
            }
          }
        }
        const executed = !reasons.length || policy === 'unguarded';
        if (executed) {
          state.batteryWh -= task.energyWh;
          state.storageMb += task.type === 'observe' ? task.dataMb : -task.dataMb;
          state.busyUntil = Math.max(state.busyUntil, slot + task.duration);
          for (const code of reasons) violation(code, vehicle.id, slot, eventId);
        }
        events.push({
          id: eventId,
          taskId: task.id,
          vehicleId: vehicle.id,
          slot,
          end: slot + task.duration,
          type: task.type,
          label: say(task.type, locale),
          status: executed ? (reasons.length ? 'unsafe' : 'completed') : 'blocked',
          statusLabel: say(
            executed ? (reasons.length ? 'unsafe' : 'completed') : 'blocked',
            locale,
          ),
          reasons,
          beforePolicy: policy,
          batteryWh: state.batteryWh,
          storageMb: state.storageMb,
        });
      }
      const sample = {
        id: `telemetry-${slot}-${vehicle.id}`,
        slot,
        vehicleId: vehicle.id,
        batteryWh: Number(state.batteryWh.toFixed(6)),
        storageMb: Number(state.storageMb.toFixed(6)),
        contact: inWindow(vehicle.contacts, slot) && !(hit && fault.kind === 'link-outage'),
        sensorFresh: !(hit && fault.kind === 'sensor-stale'),
      };
      telemetry.push(sample);
      if (state.batteryWh < vehicle.reserveWh - 1e-8)
        violation('POWER', vehicle.id, slot, sample.id);
      if (state.storageMb > vehicle.storageCapacityMb + 1e-8)
        violation('STORAGE', vehicle.id, slot, sample.id);
      if (state.storageMb < -1e-8) violation('DATA', vehicle.id, slot, sample.id);
    }
  }
  const completed = events
    .filter((event) => event.status === 'completed')
    .map((event) => event.taskId);
  return {
    schemaVersion: 1,
    locale,
    notice: say('notice', locale),
    inputSha256: hash(mission),
    scheduleSha256: hash(schedule),
    policy,
    fault,
    safe: findings.length === 0,
    completed,
    unexecuted: mission.tasks.filter((task) => !completed.includes(task.id)).map((task) => task.id),
    events,
    telemetry,
    findings,
    traceSha256: hash({
      mission,
      schedule,
      policy,
      fault,
      events: events.map(({ label, statusLabel, ...event }) => event),
      telemetry,
      findings: findings.map(({ message, ...finding }) => finding),
    }),
  };
}
