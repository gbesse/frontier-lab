const locales = ['fr', 'en', 'es'];
const words = {
  invalid: ['Entrée invalide.', 'Invalid input.', 'Entrada no válida.'],
  notice: [
    'Résultats bancaires fournis par l’utilisateur, non vérifiés. Aucune correction ni aucun paiement automatique.',
    'Bank results supplied by the user, not verified. No automatic correction or payment.',
    'Resultados bancarios aportados por el usuario, no verificados. Sin corrección ni pago automáticos.',
  ],
  summary: [
    '{count} contrôles ; {review} dossiers à revoir.',
    '{count} checks; {review} cases need review.',
    '{count} comprobaciones; {review} casos requieren revisión.',
  ],
  bankMatch: [
    'Correspondance déclarée par la banque ; aucune action automatique.',
    'Bank-reported match; no automatic action.',
    'Coincidencia declarada por el banco; ninguna acción automática.',
  ],
  closeMatch: [
    'Correspondance proche : confirmer le bénéficiaire hors de cet outil.',
    'Close match: confirm the payee outside this tool.',
    'Coincidencia aproximada: confirma al beneficiario fuera de esta herramienta.',
  ],
  noMatch: [
    'Absence de correspondance : ne pas modifier le référentiel sans vérification indépendante.',
    'No match: do not change master data without independent verification.',
    'Sin coincidencia: no cambies los datos maestros sin verificación independiente.',
  ],
  other: [
    'Résultat indisponible ou indéterminé : revue requise.',
    'Unavailable or indeterminate result: review required.',
    'Resultado no disponible o indeterminado: se requiere revisión.',
  ],
  accountConflict: [
    'La référence de compte diffère du référentiel fournisseur.',
    'Account reference differs from supplier master data.',
    'La referencia de cuenta difiere de los datos maestros del proveedor.',
  ],
  unknownSupplier: [
    'Fournisseur inconnu dans le référentiel fourni.',
    'Supplier absent from the supplied master data.',
    'Proveedor ausente de los datos maestros facilitados.',
  ],
};
const msg = (key, locale, values = {}) => {
  if (!locales.includes(locale)) throw Error('Locale / Langue / Idioma: fr, en, es');
  return words[key][locales.indexOf(locale)].replace(/\{(\w+)\}/g, (_, name) => values[name]);
};
const obj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const nonempty = (v) => typeof v === 'string' && v.trim().length > 0;
const validTime = (v) => nonempty(v) && Number.isFinite(Date.parse(v));
const normalize = (v) =>
  v
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en')
    .replace(/[^a-z0-9]/g, '');

export function analyzePayeeExceptions(input, { locale = 'fr' } = {}) {
  msg('invalid', locale);
  if (!obj(input) || !Array.isArray(input.suppliers) || !Array.isArray(input.checks))
    throw Error(msg('invalid', locale));
  const suppliers = new Map();
  for (const supplier of input.suppliers) {
    if (
      !obj(supplier) ||
      !nonempty(supplier.id) ||
      !nonempty(supplier.legalName) ||
      !nonempty(supplier.accountRef) ||
      !Array.isArray(supplier.tradeNames) ||
      !supplier.tradeNames.every(nonempty) ||
      suppliers.has(supplier.id)
    )
      throw Error(msg('invalid', locale));
    suppliers.set(supplier.id, supplier);
  }
  const ids = new Set();
  const cases = input.checks.map((check) => {
    if (
      !obj(check) ||
      !nonempty(check.id) ||
      !nonempty(check.supplierId) ||
      !nonempty(check.accountRef) ||
      !nonempty(check.submittedName) ||
      !validTime(check.at) ||
      !['match', 'close_match', 'no_match', 'other'].includes(check.bankResult) ||
      ids.has(check.id)
    )
      throw Error(msg('invalid', locale));
    ids.add(check.id);
    const supplier = suppliers.get(check.supplierId);
    const flags = [];
    if (!supplier) flags.push('unknownSupplier');
    else if (supplier.accountRef !== check.accountRef) flags.push('accountConflict');
    const code =
      check.bankResult === 'match'
        ? 'bankMatch'
        : check.bankResult === 'close_match'
          ? 'closeMatch'
          : check.bankResult === 'no_match'
            ? 'noMatch'
            : 'other';
    flags.push(code);
    const knownNameMatch = supplier
      ? [supplier.legalName, ...supplier.tradeNames].some(
          (name) => normalize(name) === normalize(check.submittedName),
        )
      : false;
    return {
      id: check.id,
      supplierId: check.supplierId,
      at: new Date(check.at).toISOString(),
      bankResult: check.bankResult,
      knownNameMatch,
      decision: flags.length === 1 && code === 'bankMatch' ? 'bank_reported_match' : 'review',
      findings: flags.map((flag) => ({ code: flag, message: msg(flag, locale) })),
    };
  });
  return {
    schemaVersion: 1,
    locale,
    notice: msg('notice', locale),
    summary: msg('summary', locale, {
      count: cases.length,
      review: cases.filter((item) => item.decision === 'review').length,
    }),
    cases,
  };
}
