import { number, requireInput } from './frontier-checks.js';
import { say } from './i18n.js';
export const LIGHT_KM_PER_SECOND = 299792.458;
export const JULIAN_YEAR_SECONDS = 365.25 * 86400;
export const destinations = {
  moon: { distanceKm: 384400, labelKey: 'moon' },
  mars: { distanceKm: 150000000, labelKey: 'mars' },
  proxima: { distanceKm: 4.25 * JULIAN_YEAR_SECONDS * LIGHT_KM_PER_SECOND, labelKey: 'proxima' },
};
export function lightCone(
  { destination = 'mars', sentAt = '2026-10-10T12:00:00.000Z', distanceKm } = {},
  { locale = 'fr' } = {},
) {
  say('frontierInvalid', locale);
  requireInput(
    Object.hasOwn(destinations, destination) &&
      typeof sentAt === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(sentAt) &&
      Number.isFinite(Date.parse(sentAt)),
    locale,
  );
  const distance = distanceKm ?? destinations[destination].distanceKm;
  requireInput(
    new Date(sentAt).toISOString().replace('.000Z', 'Z') === sentAt.replace('.000Z', 'Z'),
    locale,
  );
  requireInput(number(distance, 0, 10 * JULIAN_YEAR_SECONDS * LIGHT_KM_PER_SECOND), locale);
  const oneWaySeconds = distance / LIGHT_KM_PER_SECOND;
  const origin = Date.parse(sentAt);
  const iso = (delay) => new Date(origin + delay * 1000).toISOString();
  return {
    destination,
    label: say(destinations[destination].labelKey, locale),
    distanceKm: distance,
    sentAt,
    oneWaySeconds,
    roundTripSeconds: oneWaySeconds * 2,
    arrivesAt: iso(oneWaySeconds),
    earliestReplyAt: iso(oneWaySeconds * 2),
    notice: say('lightNotice', locale),
  };
}
