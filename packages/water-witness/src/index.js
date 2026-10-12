import { createHash } from 'node:crypto';

const locales = ['fr', 'en', 'es'];
const copy = {
  invalid: ['Données invalides.', 'Invalid data.', 'Datos no válidos.'],
  notice: [
    'Lecture de mesures fournies, sans avis de potabilité ni conseil médical. Non mesuré, sous la limite de quantification et mesuré sont trois états distincts.',
    'Reading of supplied measurements, not a potability opinion or medical advice. Not measured, below quantification limit and quantified are three distinct states.',
    'Lectura de mediciones aportadas, sin dictamen de potabilidad ni consejo médico. No medido, por debajo del límite de cuantificación y cuantificado son tres estados distintos.',
  ],
  summary: [
    '{requests} demande(s), {issues} limite(s) de preuve.',
    '{requests} request(s), {issues} evidence gap(s).',
    '{requests} consulta(s), {issues} límite(s) de evidencia.',
  ],
  UDI_UNKNOWN: [
    'Unité de distribution inconnue à cette date.',
    'Distribution unit unknown on that date.',
    'Unidad de distribución desconocida en esa fecha.',
  ],
  UDI_AMBIGUOUS: [
    'Plusieurs unités de distribution possibles.',
    'Multiple distribution units possible.',
    'Hay varias unidades de distribución posibles.',
  ],
  NOT_MEASURED: [
    'Aucune mesure représentative trouvée.',
    'No representative measurement found.',
    'No se encontró una medición representativa.',
  ],
  ONLY_UNREPRESENTATIVE: [
    'Seules des mesures non représentatives sont présentes.',
    'Only non-representative measurements are available.',
    'Solo hay mediciones no representativas.',
  ],
  MEASUREMENT_CONFLICT: [
    'Résultats représentatifs contradictoires à la même date.',
    'Conflicting representative results on the same date.',
    'Resultados representativos contradictorios en la misma fecha.',
  ],
  STALE: [
    'Dernière mesure plus ancienne que le délai choisi.',
    'Latest measurement is older than the chosen interval.',
    'La última medición es anterior al plazo elegido.',
  ],
};
const say = (key, locale, values = {}) => {
  const index = locales.indexOf(locale);
  if (index < 0) throw Error('Locale / Langue / Idioma: fr, en, es');
  return copy[key][index].replace(/\{(\w+)\}/g, (_, field) => values[field]);
};
const obj = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const str = (value) => typeof value === 'string' && value.trim() !== '';
const day = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  new Date(value).toISOString().slice(0, 10) === value;
const amount = (value) => typeof value === 'string' && /^\d+(?:\.\d{1,3})?$/.test(value);
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function witnessWater(input, { locale = 'fr' } = {}) {
  say('invalid', locale);
  try {
    if (
      !obj(input) ||
      !day(input.asOf) ||
      !Number.isSafeInteger(input.maxAgeDays) ||
      input.maxAgeDays < 1 ||
      !Array.isArray(input.links) ||
      !Array.isArray(input.observations) ||
      !Array.isArray(input.requests)
    )
      throw Error('invalid');
    for (const link of input.links)
      if (
        !obj(link) ||
        !str(link.commune) ||
        !str(link.udi) ||
        !day(link.from) ||
        !(link.to === null || day(link.to)) ||
        (link.to !== null && link.to < link.from)
      )
        throw Error('invalid');
    const ids = new Set();
    for (const row of input.observations) {
      if (
        !obj(row) ||
        !str(row.id) ||
        ids.has(row.id) ||
        !str(row.udi) ||
        !str(row.parameter) ||
        !day(row.sampledAt) ||
        typeof row.representative !== 'boolean' ||
        !str(row.source) ||
        !['quantified', 'below_limit'].includes(row.kind) ||
        (row.kind === 'quantified' && !amount(row.valueNgL)) ||
        (row.kind === 'below_limit' && !amount(row.quantificationLimitNgL))
      )
        throw Error('invalid');
      ids.add(row.id);
    }
    const findings = [];
    const add = (code, ref) => findings.push({ code, message: say(code, locale), ref });
    const requests = input.requests.map((request, index) => {
      if (
        !obj(request) ||
        !str(request.commune) ||
        !Array.isArray(request.parameters) ||
        !request.parameters.length ||
        !request.parameters.every(str) ||
        new Set(request.parameters).size !== request.parameters.length
      )
        throw Error('invalid');
      const ref = `requests.${index}`;
      const units = [
        ...new Set(
          input.links
            .filter(
              (link) =>
                link.commune === request.commune &&
                link.from <= input.asOf &&
                (link.to === null || input.asOf <= link.to),
            )
            .map((link) => link.udi),
        ),
      ];
      if (units.length !== 1) add(units.length ? 'UDI_AMBIGUOUS' : 'UDI_UNKNOWN', ref);
      const parameters = request.parameters.map((parameter) => {
        if (units.length !== 1) return { parameter, state: 'unresolved_udi' };
        const samples = input.observations.filter(
          (row) =>
            row.udi === units[0] && row.parameter === parameter && row.sampledAt <= input.asOf,
        );
        const representative = samples
          .filter((row) => row.representative)
          .sort((a, b) => b.sampledAt.localeCompare(a.sampledAt));
        if (!representative.length) {
          add(samples.length ? 'ONLY_UNREPRESENTATIVE' : 'NOT_MEASURED', `${ref}.${parameter}`);
          return { parameter, state: 'not_measured' };
        }
        const latest = representative[0];
        const sameDay = representative.filter((row) => row.sampledAt === latest.sampledAt);
        const signatures = new Set(
          sameDay.map(
            (row) => `${row.kind}:${row.valueNgL ?? ''}:${row.quantificationLimitNgL ?? ''}`,
          ),
        );
        if (signatures.size > 1) {
          add('MEASUREMENT_CONFLICT', `${ref}.${parameter}`);
          return {
            parameter,
            state: 'conflicting',
            sampledAt: latest.sampledAt,
            valueNgL: null,
            quantificationLimitNgL: null,
          };
        }
        const ageDays = (Date.parse(input.asOf) - Date.parse(latest.sampledAt)) / 86400000;
        if (ageDays > input.maxAgeDays) add('STALE', `${ref}.${parameter}`);
        return {
          parameter,
          state: ageDays > input.maxAgeDays ? 'stale' : latest.kind,
          sampledAt: latest.sampledAt,
          valueNgL: latest.kind === 'quantified' ? latest.valueNgL : null,
          quantificationLimitNgL:
            latest.kind === 'below_limit' ? latest.quantificationLimitNgL : null,
          source: latest.source,
        };
      });
      return { ref, udi: units.length === 1 ? units[0] : null, parameters };
    });
    return {
      schemaVersion: 1,
      locale,
      notice: say('notice', locale),
      summary: say('summary', locale, { requests: requests.length, issues: findings.length }),
      inputSha256: hash(input),
      requests,
      findings,
    };
  } catch {
    throw Error(say('invalid', locale));
  }
}
