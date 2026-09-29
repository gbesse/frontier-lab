const locales = ['fr', 'en', 'es'];
const words = {
  invalid: ['Entrée invalide.', 'Invalid input.', 'Entrada no válida.'],
  notice: [
    'Événements fournis par l’utilisateur, non vérifiés auprès des plateformes. Aucune facture transmise.',
    'User-supplied events, not verified with platforms. No invoice is transmitted.',
    'Eventos aportados por el usuario, no verificados con las plataformas. No se transmite ninguna factura.',
  ],
  summary: [
    '{count} factures ; {issues} anomalies de parcours.',
    '{count} invoices; {issues} route findings.',
    '{count} facturas; {issues} incidencias de recorrido.',
  ],
  missingSent: [
    'Aucun événement d’envoi fourni.',
    'No supplied sent event.',
    'No se proporcionó ningún evento de envío.',
  ],
  missingReceived: [
    'Aucun événement de réception fourni.',
    'No supplied received event.',
    'No se proporcionó ningún evento de recepción.',
  ],
  missingAccepted: [
    'Aucun événement d’acceptation fourni.',
    'No supplied accepted event.',
    'No se proporcionó ningún evento de aceptación.',
  ],
  wrongRoute: [
    'Plateforme de réception différente de celle attendue.',
    'Receiving platform differs from the expected one.',
    'La plataforma receptora difiere de la esperada.',
  ],
  rejected: [
    'Un rejet figure dans les événements fournis.',
    'A rejection appears in the supplied events.',
    'Aparece un rechazo en los eventos proporcionados.',
  ],
  duplicateEvent: [
    'Identifiant d’événement répété.',
    'Repeated event identifier.',
    'Identificador de evento repetido.',
  ],
  unknownInvoice: [
    'Événement lié à une facture inconnue.',
    'Event refers to an unknown invoice.',
    'El evento se refiere a una factura desconocida.',
  ],
  outOfOrder: [
    'La réception précède l’envoi dans les horodatages fournis.',
    'Receipt precedes sending in the supplied timestamps.',
    'La recepción precede al envío en las marcas de tiempo facilitadas.',
  ],
};
const msg = (key, locale, params = {}) => {
  if (!locales.includes(locale)) throw Error('Locale / Langue / Idioma: fr, en, es');
  return words[key][locales.indexOf(locale)].replace(/\{(\w+)\}/g, (_, name) => params[name]);
};
const obj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const nonempty = (v) => typeof v === 'string' && v.trim().length > 0;
const validTime = (v) => nonempty(v) && Number.isFinite(Date.parse(v));
const statuses = ['sent', 'received', 'accepted', 'rejected'];

export function analyzeInvoicePath(input, { locale = 'fr' } = {}) {
  msg('invalid', locale);
  if (!obj(input) || !Array.isArray(input.invoices) || !Array.isArray(input.events))
    throw Error(msg('invalid', locale));
  const invoices = new Map();
  for (const invoice of input.invoices) {
    if (
      !obj(invoice) ||
      !nonempty(invoice.id) ||
      !nonempty(invoice.expectedPlatform) ||
      invoices.has(invoice.id)
    )
      throw Error(msg('invalid', locale));
    invoices.set(invoice.id, invoice);
  }
  const byInvoice = new Map([...invoices.keys()].map((id) => [id, []]));
  const issues = [];
  const issue = (code, context) => issues.push({ code, message: msg(code, locale), ...context });
  const seen = new Set();
  for (const event of input.events) {
    if (
      !obj(event) ||
      !nonempty(event.id) ||
      !nonempty(event.invoiceId) ||
      !nonempty(event.source) ||
      !validTime(event.at) ||
      !statuses.includes(event.status) ||
      (['received', 'accepted'].includes(event.status) && !nonempty(event.platform))
    )
      throw Error(msg('invalid', locale));
    if (seen.has(event.id)) {
      issue('duplicateEvent', { eventId: event.id });
      continue;
    }
    seen.add(event.id);
    if (!invoices.has(event.invoiceId)) {
      issue('unknownInvoice', { eventId: event.id });
      continue;
    }
    byInvoice.get(event.invoiceId).push({
      id: event.id,
      source: event.source,
      status: event.status,
      at: new Date(event.at).toISOString(),
      ...(event.platform ? { platform: event.platform } : {}),
    });
  }
  const paths = [...invoices.values()].map((invoice) => {
    const events = byInvoice.get(invoice.id).sort((a, b) => a.at.localeCompare(b.at));
    const codes = new Set(events.map((event) => event.status));
    const firstSent = events.find((event) => event.status === 'sent');
    const firstReceived = events.find((event) => event.status === 'received');
    if (!firstSent) issue('missingSent', { invoiceId: invoice.id });
    if (!firstReceived) issue('missingReceived', { invoiceId: invoice.id });
    if (!codes.has('accepted') && !codes.has('rejected'))
      issue('missingAccepted', { invoiceId: invoice.id });
    if (codes.has('rejected')) issue('rejected', { invoiceId: invoice.id });
    if (
      events.some(
        (e) =>
          ['received', 'accepted'].includes(e.status) && e.platform !== invoice.expectedPlatform,
      )
    )
      issue('wrongRoute', { invoiceId: invoice.id });
    if (firstSent && firstReceived && firstReceived.at < firstSent.at)
      issue('outOfOrder', { invoiceId: invoice.id });
    return { id: invoice.id, expectedPlatform: invoice.expectedPlatform, events };
  });
  return {
    schemaVersion: 1,
    locale,
    notice: msg('notice', locale),
    summary: msg('summary', locale, { count: paths.length, issues: issues.length }),
    paths,
    issues,
  };
}
