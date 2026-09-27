const languages = ['fr', 'en', 'es'];
const copy = {
  invalidInput: ['Entrée invalide', 'Invalid input', 'Entrada no válida'],
  authorization: [
    'Une déclaration de droit d’accès non expirée est requise.',
    'A non-expired access declaration is required.',
    'Se necesita una declaración de acceso no caducada.',
  ],
  declaration: [
    'Droit d’accès déclaré par l’utilisateur, non vérifié auprès du détenteur des données.',
    'Access right declared by the user, not verified with the data holder.',
    'Acceso declarado por el usuario, no verificado con el titular de los datos.',
  ],
  summary: [
    '{records} mesures normalisées ; {issues} anomalies à examiner.',
    '{records} normalized readings; {issues} findings to review.',
    '{records} mediciones normalizadas; {issues} incidencias por revisar.',
  ],
  outOfScope: [
    'Équipement ou mesure hors du périmètre déclaré.',
    'Asset or metric outside the declared scope.',
    'Equipo o medición fuera del alcance declarado.',
  ],
  invalidReading: [
    'Mesure ou horodatage invalide.',
    'Invalid reading or timestamp.',
    'Medición o marca de tiempo no válida.',
  ],
  unsupported: [
    'Mesure ou unité non prise en charge.',
    'Unsupported metric or unit.',
    'Medición o unidad no admitida.',
  ],
  duplicate: [
    'Mesure répétée au même instant ; première valeur conservée.',
    'Reading repeated at the same time; first value kept.',
    'Medición repetida en el mismo momento; se conserva el primer valor.',
  ],
  conflict: [
    'Valeurs contradictoires au même instant ; première valeur conservée.',
    'Conflicting values at the same time; first value kept.',
    'Valores contradictorios en el mismo momento; se conserva el primero.',
  ],
  gap: [
    'Intervalle supérieur à la cadence attendue.',
    'Interval exceeds the expected cadence.',
    'El intervalo supera la frecuencia esperada.',
  ],
};

export function machineMessage(key, locale = 'fr', params = {}) {
  if (!languages.includes(locale)) throw Error('Locale must be fr, en or es');
  return copy[key][languages.indexOf(locale)].replace(/\{(\w+)\}/g, (_, name) => params[name]);
}

const units = {
  temperature: {
    C: (value) => value,
    F: (value) => (value - 32) * (5 / 9),
  },
  pressure: {
    kPa: (value) => value,
    bar: (value) => value * 100,
  },
  operatingHours: {
    h: (value) => value,
    min: (value) => value / 60,
  },
};
const canonicalUnit = { temperature: 'C', pressure: 'kPa', operatingHours: 'h' };
const validDate = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const object = (value) => value && typeof value === 'object' && !Array.isArray(value);

export function analyzeMachineData(input, { locale = 'fr', asOf = new Date().toISOString() } = {}) {
  machineMessage('invalidInput', locale);
  if (!object(input) || !Array.isArray(input.feeds) || !validDate(asOf))
    throw Error(machineMessage('invalidInput', locale));
  const access = input.access;
  if (
    !object(access) ||
    !access.recipient ||
    !access.purpose ||
    !Array.isArray(access.assets) ||
    !Array.isArray(access.metrics) ||
    !validDate(access.expiresAt) ||
    Date.parse(access.expiresAt) <= Date.parse(asOf)
  )
    throw Error(machineMessage('authorization', locale));
  const issues = [];
  const records = [];
  const seen = new Map();
  const issue = (code, context) =>
    issues.push({ code, message: machineMessage(code, locale), ...context });
  for (const [feedIndex, feed] of input.feeds.entries()) {
    if (
      !object(feed) ||
      typeof feed.source !== 'string' ||
      typeof feed.assetField !== 'string' ||
      typeof feed.timeField !== 'string' ||
      !object(feed.measurements) ||
      !Array.isArray(feed.rows)
    )
      throw Error(machineMessage('invalidInput', locale));
    for (const [rowIndex, row] of feed.rows.entries()) {
      if (!object(row)) throw Error(machineMessage('invalidInput', locale));
      const assetId = row[feed.assetField];
      const at = row[feed.timeField];
      if (typeof assetId !== 'string' || !validDate(at)) {
        issue('invalidReading', { feedIndex, rowIndex });
        continue;
      }
      for (const [metric, spec] of Object.entries(feed.measurements)) {
        if (!object(spec) || typeof spec.field !== 'string' || typeof spec.unit !== 'string')
          throw Error(machineMessage('invalidInput', locale));
        const value = row[spec.field];
        if (value === undefined || value === null || value === '') continue;
        const context = { feedIndex, rowIndex, assetId, metric };
        if (!access.assets.includes(assetId) || !access.metrics.includes(metric)) {
          issue('outOfScope', context);
          continue;
        }
        if (!units[metric]?.[spec.unit]) {
          issue('unsupported', context);
          continue;
        }
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          issue('invalidReading', context);
          continue;
        }
        const normalized = Number(units[metric][spec.unit](value).toFixed(4));
        const instant = new Date(at).toISOString();
        const key = JSON.stringify([assetId, metric, instant]);
        if (seen.has(key)) {
          issue(seen.get(key) === normalized ? 'duplicate' : 'conflict', context);
          continue;
        }
        seen.set(key, normalized);
        records.push({
          assetId,
          metric,
          at: instant,
          value: normalized,
          unit: canonicalUnit[metric],
          provenance: {
            source: feed.source,
            rowIndex,
            originalValue: value,
            originalUnit: spec.unit,
          },
        });
      }
    }
  }
  records.sort(
    (a, b) =>
      a.assetId.localeCompare(b.assetId) ||
      a.metric.localeCompare(b.metric) ||
      a.at.localeCompare(b.at),
  );
  for (let index = 1; index < records.length; index++) {
    const previous = records[index - 1],
      current = records[index];
    if (previous.assetId !== current.assetId || previous.metric !== current.metric) continue;
    const cadence = input.expectedCadenceMinutes?.[current.metric];
    if (typeof cadence === 'number' && cadence > 0 && Number.isFinite(cadence)) {
      const minutes = (Date.parse(current.at) - Date.parse(previous.at)) / 60000;
      if (minutes > cadence * 1.5)
        issue('gap', {
          assetId: current.assetId,
          metric: current.metric,
          from: previous.at,
          to: current.at,
          minutes,
        });
    }
  }
  return {
    schemaVersion: 1,
    locale,
    access: { recipient: access.recipient, purpose: access.purpose, expiresAt: access.expiresAt },
    notice: machineMessage('declaration', locale),
    summary: machineMessage('summary', locale, { records: records.length, issues: issues.length }),
    records,
    issues,
  };
}
