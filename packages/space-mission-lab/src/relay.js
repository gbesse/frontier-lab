import { fingerprint } from '@gbesse/branch-lab';
import { identifier, number, integer, unique, requireInput } from './frontier-checks.js';
import { say } from './i18n.js';

function checkNetwork(input, locale) {
  requireInput(
    input?.schemaVersion === 1 &&
      Array.isArray(input.nodes) &&
      input.nodes.length >= 2 &&
      input.nodes.length <= 12 &&
      new Set(input.nodes).size === input.nodes.length &&
      input.nodes.every(identifier),
    locale,
  );
  requireInput(
    Array.isArray(input.contacts) &&
      input.contacts.length <= 96 &&
      unique(input.contacts) &&
      Array.isArray(input.bundles) &&
      input.bundles.length <= 24 &&
      unique(input.bundles),
    locale,
  );
  for (const contact of input.contacts)
    requireInput(
      identifier(contact.id) &&
        input.nodes.includes(contact.from) &&
        input.nodes.includes(contact.to) &&
        contact.from !== contact.to &&
        number(contact.start) &&
        number(contact.end, contact.start + 0.001) &&
        integer(contact.rateBytesPerSec, 1) &&
        number(contact.latencySec) &&
        integer(contact.costUnits),
      locale,
    );
  for (const bundle of input.bundles)
    requireInput(
      identifier(bundle.id) &&
        input.nodes.includes(bundle.from) &&
        input.nodes.includes(bundle.to) &&
        bundle.from !== bundle.to &&
        number(bundle.createdAt) &&
        number(bundle.expiresAt, bundle.createdAt) &&
        integer(bundle.bytes, 1, 1e12) &&
        integer(bundle.priority, 1, 100),
      locale,
    );
}
function departure(contact, earliest, duration, reservations) {
  let start = Math.max(earliest, contact.start);
  for (const booked of [...reservations].sort((a, b) => a.start - b.start)) {
    if (start + duration <= booked.start) break;
    if (start < booked.end && start + duration > booked.start) start = booked.end;
  }
  return start + duration <= contact.end ? start : null;
}
export function simulateRelay(
  input,
  { locale = 'fr', policy = 'store-forward', disabledContacts = [] } = {},
) {
  say('frontierInvalid', locale);
  checkNetwork(input, locale);
  requireInput(
    ['store-forward', 'immediate-direct'].includes(policy) &&
      Array.isArray(disabledContacts) &&
      disabledContacts.every((id) => input.contacts.some((contact) => contact.id === id)),
    locale,
  );
  const contacts = input.contacts
    .filter((contact) => !disabledContacts.includes(contact.id))
    .sort((a, b) => a.id.localeCompare(b.id, 'en'));
  const reservations = new Map(contacts.map((contact) => [contact.id, []]));
  const bundles = [];
  for (const bundle of [...input.bundles].sort(
    (a, b) =>
      b.priority - a.priority || a.createdAt - b.createdAt || a.id.localeCompare(b.id, 'en'),
  )) {
    const arrivals = new Map([[bundle.from, bundle.createdAt]]),
      paths = new Map([[bundle.from, []]]),
      visited = new Set();
    while (true) {
      const current = [...arrivals.entries()]
        .filter(([node]) => !visited.has(node))
        .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0], 'en'))[0];
      if (!current || current[0] === bundle.to) break;
      const [node, earliest] = current;
      visited.add(node);
      for (const contact of contacts.filter((contact) => contact.from === node)) {
        if (policy === 'immediate-direct' && (node !== bundle.from || contact.to !== bundle.to))
          continue;
        const duration = bundle.bytes / contact.rateBytesPerSec;
        const start = departure(contact, earliest, duration, reservations.get(contact.id));
        if (start === null || (policy === 'immediate-direct' && start !== bundle.createdAt))
          continue;
        const arrivalAt = start + duration + contact.latencySec;
        if (arrivalAt > bundle.expiresAt || arrivalAt >= (arrivals.get(contact.to) ?? Infinity))
          continue;
        const hop = {
          contactId: contact.id,
          from: contact.from,
          to: contact.to,
          sendAt: start,
          transmissionEndsAt: start + duration,
          arrivalAt,
          waitingSec: start - earliest,
          bytes: bundle.bytes,
          costUnits: contact.costUnits,
        };
        arrivals.set(contact.to, arrivalAt);
        paths.set(contact.to, [...paths.get(node), hop]);
      }
    }
    const route = paths.get(bundle.to),
      delivered = !!route;
    if (route)
      for (const hop of route)
        reservations
          .get(hop.contactId)
          .push({ start: hop.sendAt, end: hop.transmissionEndsAt, bundleId: bundle.id });
    const result = {
      id: bundle.id,
      status: delivered ? 'delivered' : 'unreachable',
      from: bundle.from,
      to: bundle.to,
      bytes: bundle.bytes,
      createdAt: bundle.createdAt,
      deliveredAt: arrivals.get(bundle.to) ?? null,
      hops: route ?? [],
      costUnits: (route ?? []).reduce((sum, hop) => sum + hop.costUnits, 0),
    };
    result.proofSha256 = fingerprint(result);
    bundles.push({ ...result, label: say(result.status, locale) });
  }
  const delivered = bundles.filter((bundle) => bundle.status === 'delivered').length;
  return {
    schemaVersion: 1,
    locale,
    policy,
    notice: say('relayNotice', locale),
    delivered,
    total: bundles.length,
    bundles,
    reservations: Object.fromEntries(reservations),
    inputSha256: fingerprint(input),
    traceSha256: fingerprint(bundles.map(({ label, ...bundle }) => bundle)),
  };
}
export function exportIonContacts(input, { locale = 'fr', disabledContacts = [] } = {}) {
  checkNetwork(input, locale);
  requireInput(
    Array.isArray(disabledContacts) &&
      disabledContacts.every((id) => input.contacts.some((contact) => contact.id === id)),
    locale,
  );
  const nodeNumbers = Object.fromEntries(input.nodes.map((id, index) => [id, index + 1]));
  const lines = ['@ 0', '^ 1'];
  for (const contact of input.contacts.filter(
    (contact) => !disabledContacts.includes(contact.id),
  )) {
    // ION contact windows/ranges are integer seconds; round inward so capacity is not inflated.
    const start = Math.ceil(contact.start),
      end = Math.floor(contact.end);
    if (end <= start) continue;
    lines.push(
      `a contact +${start} +${end} ${nodeNumbers[contact.from]} ${nodeNumbers[contact.to]} ${contact.rateBytesPerSec}`,
    );
    lines.push(
      `a range +${start} +${end} ${nodeNumbers[contact.from]} ${nodeNumbers[contact.to]} ${Math.ceil(contact.latencySec)}`,
    );
  }
  return { nodeNumbers, text: lines.join('\n') + '\n', notice: say('ionNotice', locale) };
}
