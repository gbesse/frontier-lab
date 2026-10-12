import { createHash } from 'node:crypto';
import { say } from './i18n.js';

export const faultKinds = ['nominal', 'link-outage', 'low-power', 'sensor-stale'];
export const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const finite = (value, min, max) =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const id = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value);
const unique = (rows) => new Set(rows.map((row) => row.id)).size === rows.length;
export function checkMission(mission, locale = 'fr') {
  try {
    if (
      !mission ||
      mission.schemaVersion !== 1 ||
      !id(mission.id) ||
      !integer(mission.horizonSlots, 1, 48) ||
      !finite(mission.slotMinutes, 1, 60)
    )
      throw 0;
    if (
      !Array.isArray(mission.vehicles) ||
      !integer(mission.vehicles.length, 1, 6) ||
      !unique(mission.vehicles)
    )
      throw 0;
    for (const vehicle of mission.vehicles) {
      if (
        !id(vehicle.id) ||
        !finite(vehicle.batteryCapacityWh, 1, 1e6) ||
        !finite(vehicle.batteryWh, 0, vehicle.batteryCapacityWh) ||
        !finite(vehicle.reserveWh, 0, vehicle.batteryWh) ||
        !finite(vehicle.baseLoadWh, 0, 1e6) ||
        !finite(vehicle.rechargeWh, 0, 1e6) ||
        !finite(vehicle.storageCapacityMb, 1, 1e6) ||
        !finite(vehicle.storageMb, 0, vehicle.storageCapacityMb)
      )
        throw 0;
      for (const windows of [vehicle.contacts, vehicle.sunlight]) {
        if (
          !Array.isArray(windows) ||
          windows.length > 48 ||
          windows.some(
            (window) =>
              !integer(window.start, 0, mission.horizonSlots - 1) ||
              !integer(window.end, window.start + 1, mission.horizonSlots),
          )
        )
          throw 0;
      }
    }
    if (!Array.isArray(mission.tasks) || mission.tasks.length > 24 || !unique(mission.tasks))
      throw 0;
    const ids = new Set(mission.vehicles.map((vehicle) => vehicle.id));
    for (const task of mission.tasks) {
      if (
        !id(task.id) ||
        !['observe', 'downlink'].includes(task.type) ||
        !integer(task.start, 0, mission.horizonSlots - 1) ||
        !integer(task.end, task.start + 1, mission.horizonSlots) ||
        !integer(task.duration, 1, task.end - task.start) ||
        !integer(task.priority, 1, 100) ||
        !finite(task.energyWh, 0, 1e6) ||
        !finite(task.dataMb, 0, 1e6) ||
        !Array.isArray(task.vehicleIds) ||
        !task.vehicleIds.length ||
        task.vehicleIds.length > ids.size ||
        new Set(task.vehicleIds).size !== task.vehicleIds.length ||
        task.vehicleIds.some((value) => !ids.has(value))
      )
        throw 0;
    }
  } catch {
    throw Object.assign(new Error(say('invalid', locale)), { code: 'INVALID_MISSION' });
  }
  return mission;
}
export function checkOptions(
  mission,
  { locale = 'fr', policy = 'guarded', fault = { kind: 'nominal' } } = {},
) {
  say('invalid', locale);
  checkMission(mission, locale);
  if (
    !['guarded', 'unguarded'].includes(policy) ||
    !fault ||
    !faultKinds.includes(fault.kind) ||
    !integer(fault.start ?? 0, 0, mission.horizonSlots - 1) ||
    (fault.vehicleId !== undefined &&
      !mission.vehicles.some((vehicle) => vehicle.id === fault.vehicleId))
  )
    throw Object.assign(new Error(say('invalid', locale)), { code: 'INVALID_OPTIONS' });
  return { locale, policy, fault: { ...fault, start: fault.start ?? 0 } };
}
export function checkSchedule(mission, schedule, locale) {
  if (
    !Array.isArray(schedule) ||
    schedule.length > mission.tasks.length ||
    new Set(schedule.map((item) => item?.taskId)).size !== schedule.length
  )
    throw new Error(say('invalid', locale));
  for (const item of schedule) {
    const task = mission.tasks.find((task) => task.id === item?.taskId);
    if (
      !task ||
      !task.vehicleIds.includes(item.vehicleId) ||
      !integer(item.start, task.start, task.end - task.duration)
    )
      throw new Error(say('invalid', locale));
  }
}
export const inWindow = (windows, slot) =>
  windows.some((window) => slot >= window.start && slot < window.end);
export const affected = (fault, vehicleId, slot) =>
  fault.kind !== 'nominal' &&
  slot >= fault.start &&
  (fault.vehicleId === undefined || fault.vehicleId === vehicleId);
