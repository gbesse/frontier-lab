import { integer, requireInput } from './frontier-checks.js';
export function frontierConfig(input = {}) {
  const locale = ['fr', 'en', 'es'].includes(input?.locale) ? input.locale : 'fr';
  requireInput(input && typeof input === 'object' && !Array.isArray(input));
  const allowed = [
    'destination',
    'relayPolicy',
    'outage',
    'doubleSpend',
    'seed',
    'signalInjection',
    'locale',
  ];
  requireInput(
    Object.keys(input).every((key) => allowed.includes(key)),
    locale,
  );
  const config = {
    destination: 'mars',
    relayPolicy: 'store-forward',
    outage: false,
    doubleSpend: false,
    seed: 20261010,
    signalInjection: true,
    locale: 'fr',
    ...input,
  };
  requireInput(
    ['moon', 'mars', 'proxima'].includes(config.destination) &&
      ['store-forward', 'immediate-direct'].includes(config.relayPolicy) &&
      ['fr', 'en', 'es'].includes(config.locale) &&
      integer(config.seed, 0, 0xffffffff) &&
      ['outage', 'doubleSpend', 'signalInjection'].every((key) => typeof config[key] === 'boolean'),
    ['fr', 'en', 'es'].includes(config.locale) ? config.locale : 'fr',
  );
  return config;
}
export function sharedFrontier(origin, input = {}) {
  const config = frontierConfig(input),
    url = new URL('/space', origin);
  requireInput(
    ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password,
    config.locale,
  );
  url.search = new URLSearchParams({
    v: '1',
    dst: config.destination,
    relay: config.relayPolicy,
    outage: config.outage ? '1' : '0',
    conflict: config.doubleSpend ? '1' : '0',
    seed: String(config.seed),
    signal: config.signalInjection ? '1' : '0',
    lang: config.locale,
  }).toString();
  url.hash = 'frontier';
  return url.toString();
}
export function readSharedFrontier(search) {
  const params = new URLSearchParams(search);
  if (!params.has('v')) {
    requireInput(
      [...params.keys()].every((key) => key === 'lang') && params.getAll('lang').length <= 1,
    );
    return frontierConfig(params.has('lang') ? { locale: params.get('lang') } : {});
  }
  requireInput(
    params.get('v') === '1' &&
      [...params.keys()].every((key) =>
        ['v', 'dst', 'relay', 'outage', 'conflict', 'seed', 'signal', 'lang'].includes(key),
      ) &&
      [...params.keys()].every((key) => params.getAll(key).length === 1) &&
      ['outage', 'conflict', 'signal'].every((key) => ['0', '1'].includes(params.get(key))) &&
      /^\d{1,10}$/.test(params.get('seed') ?? ''),
  );
  return frontierConfig({
    destination: params.get('dst'),
    relayPolicy: params.get('relay'),
    outage: params.get('outage') === '1',
    doubleSpend: params.get('conflict') === '1',
    seed: Number(params.get('seed')),
    signalInjection: params.get('signal') === '1',
    locale: params.get('lang'),
  });
}
