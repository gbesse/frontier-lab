import { say } from './i18n.js';
export const identifier = (value) =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value);
export const number = (value, min = 0, max = 1e10) =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
export const integer = (value, min = 0, max = 1e9) =>
  Number.isSafeInteger(value) && value >= min && value <= max;
export const unique = (items) => new Set(items.map((item) => item?.id)).size === items.length;
export function requireInput(condition, locale = 'fr') {
  if (!condition)
    throw Object.assign(new Error(say('frontierInvalid', locale)), { code: 'INVALID_FRONTIER' });
}
