import { createHash } from 'node:crypto';

const locales = ['fr', 'en', 'es'];
const words = {
  invalid: ['Données invalides.', 'Invalid data.', 'Datos no válidos.'],
  notice: [
    'Audit des dépendances déclarées, sans découverte automatique ni garantie de continuité. Vérifiez les calendriers auprès des opérateurs.',
    'Audit of declared dependencies, without automatic discovery or continuity guarantee. Verify schedules with operators.',
    'Auditoría de dependencias declaradas, sin descubrimiento automático ni garantía de continuidad. Verifica los calendarios con los operadores.',
  ],
  summary: [
    '{count} équipement(s), {issues} point(s) à traiter.',
    '{count} asset(s), {issues} issue(s) to address.',
    '{count} equipo(s), {issues} punto(s) por resolver.',
  ],
  UNKNOWN_CLOSURE: [
    'Calendrier de fermeture absent.',
    'Closure schedule missing.',
    'Falta el calendario de cierre.',
  ],
  CONFLICTING_CLOSURE: [
    'Calendriers contradictoires.',
    'Conflicting closure schedules.',
    'Calendarios de cierre contradictorios.',
  ],
  OUTAGE_EXPOSURE: [
    'Service déclaré exposé à une fermeture déjà effective.',
    'Declared service exposed to an effective shutdown.',
    'Servicio declarado expuesto a un cierre ya efectivo.',
  ],
  DEADLINE_NEAR: [
    'Fermeture proche sans essai de remplacement probant.',
    'Shutdown near without a convincing replacement test.',
    'Cierre próximo sin una prueba suficiente del reemplazo.',
  ],
  REPLACEMENT_FAILED: [
    'Essai du remplacement échoué.',
    'Replacement test failed.',
    'Falló la prueba del reemplazo.',
  ],
  INVALID_TEST: [
    'Essai du remplacement incomplet ou chronologiquement invalide.',
    'Replacement test incomplete or chronologically invalid.',
    'Prueba del reemplazo incompleta o cronológicamente inválida.',
  ],
};
const say = (key, locale, values = {}) => {
  const index = locales.indexOf(locale);
  if (index < 0) throw Error('Locale / Langue / Idioma: fr, en, es');
  return words[key][index].replace(/\{(\w+)\}/g, (_, field) => values[field]);
};
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;
const day = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  new Date(value).toISOString().slice(0, 10) === value;
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const daysUntil = (from, to) => (Date.parse(to) - Date.parse(from)) / 86400000;

export function auditLastSignal(input, { locale = 'fr' } = {}) {
  say('invalid', locale);
  try {
    if (
      !isObject(input) ||
      !day(input.asOf) ||
      !Array.isArray(input.assets) ||
      !Array.isArray(input.closures)
    )
      throw Error('invalid');
    const ids = new Set();
    for (const row of input.closures) {
      if (
        !isObject(row) ||
        !['copper', '2g', '3g'].includes(row.technology) ||
        !nonempty(row.networkOperator) ||
        !nonempty(row.area) ||
        !day(row.effectiveAt) ||
        !nonempty(row.source)
      )
        throw Error('invalid');
    }
    const findings = [];
    const add = (code, ref) => findings.push({ code, message: say(code, locale), ref });
    const assets = input.assets.map((asset, assetIndex) => {
      if (
        !isObject(asset) ||
        !nonempty(asset.id) ||
        ids.has(asset.id) ||
        !['critical', 'normal'].includes(asset.criticality) ||
        !Array.isArray(asset.dependencies) ||
        asset.dependencies.length === 0 ||
        asset.replacement !== undefined
      )
        throw Error('invalid');
      ids.add(asset.id);
      const dependencies = asset.dependencies.map((dependency, dependencyIndex) => {
        if (
          !isObject(dependency) ||
          !['copper', '2g', '3g'].includes(dependency.technology) ||
          !nonempty(dependency.networkOperator) ||
          !nonempty(dependency.area) ||
          !nonempty(dependency.contractRef)
        )
          throw Error('invalid');
        const ref = `assets.${assetIndex}.dependencies.${dependencyIndex}`;
        const replacement = dependency.replacement;
        let tested = false;
        if (replacement !== undefined) {
          if (
            !isObject(replacement) ||
            !['pass', 'fail'].includes(replacement.result) ||
            !day(replacement.installedAt) ||
            !day(replacement.testedAt) ||
            !nonempty(replacement.evidenceRef) ||
            replacement.testedAt < replacement.installedAt ||
            replacement.testedAt > input.asOf
          )
            add('INVALID_TEST', `${ref}.replacement`);
          else if (replacement.result === 'fail') add('REPLACEMENT_FAILED', `${ref}.replacement`);
          else tested = true;
        }
        const matches = input.closures.filter(
          (row) =>
            row.technology === dependency.technology &&
            row.networkOperator === dependency.networkOperator &&
            row.area === dependency.area,
        );
        const dates = [...new Set(matches.map((row) => row.effectiveAt))];
        if (!matches.length) add('UNKNOWN_CLOSURE', ref);
        else if (dates.length > 1) add('CONFLICTING_CLOSURE', ref);
        else if (!tested && daysUntil(input.asOf, dates[0]) <= 0) add('OUTAGE_EXPOSURE', ref);
        else if (!tested && daysUntil(input.asOf, dates[0]) <= 180) add('DEADLINE_NEAR', ref);
        return {
          technology: dependency.technology,
          effectiveAt: dates.length === 1 ? dates[0] : null,
          scheduleKnown: dates.length === 1,
          replacementTested: tested,
        };
      });
      return { ref: `assets.${assetIndex}`, criticality: asset.criticality, dependencies };
    });
    return {
      schemaVersion: 1,
      locale,
      notice: say('notice', locale),
      summary: say('summary', locale, { count: assets.length, issues: findings.length }),
      inputSha256: digest(input),
      assets,
      findings,
    };
  } catch {
    throw Error(say('invalid', locale));
  }
}
