import { message } from './i18n.js';
import { requireValue, positive, finite, object } from './validate.js';

const t95 = [
  0, 12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16,
  2.145, 2.131, 2.12, 2.11, 2.101, 2.093, 2.086, 2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052,
  2.048, 2.045, 2.042,
];
export const studentCritical = (df) => t95[Math.min(df, 30)];
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const canonical = (v) =>
  JSON.stringify(
    Object.keys(v)
      .sort()
      .map((k) => [k, v[k]]),
  );

export function flexureStiffness(
  { youngGpa, lengthUm, widthUm, thicknessUm },
  { locale = 'fr' } = {},
) {
  requireValue(
    [youngGpa, lengthUm, widthUm, thicknessUm].every(positive) &&
      youngGpa <= 1000 &&
      lengthUm >= 1 &&
      lengthUm <= 100000 &&
      widthUm <= 100000 &&
      thicknessUm <= 100000,
    locale,
  );
  // Euler–Bernoulli cantilever, tip force, bending along thickness, small deflection.
  return (
    (youngGpa * 1e9 * widthUm * 1e-6 * (thicknessUm * 1e-6) ** 3) / (4 * (lengthUm * 1e-6) ** 3)
  );
}

export function summarizeRevision(revision, { locale = 'fr' } = {}) {
  requireValue(
    object(revision) &&
      typeof revision.id === 'string' &&
      revision.id.length > 0 &&
      revision.id.length < 200 &&
      positive(revision.predictedStiffnessNPerM) &&
      revision.predictedStiffnessNPerM <= 1e12,
    locale,
  );
  requireValue(
    object(revision.conditions) &&
      ['instrument', 'calibration', 'fixture', 'temperatureC'].every((k) =>
        Object.hasOwn(revision.conditions, k),
      ),
    locale,
  );
  requireValue(
    ['instrument', 'calibration', 'fixture'].every(
      (k) => typeof revision.conditions[k] === 'string' && revision.conditions[k].length > 0,
    ) && finite(revision.conditions.temperatureC),
    locale,
  );
  requireValue(
    Array.isArray(revision.measurements) && revision.measurements.length <= 100000,
    locale,
  );
  const specimens = new Map();
  for (const row of revision.measurements) {
    requireValue(
      object(row) &&
        typeof row.specimenId === 'string' &&
        row.specimenId.length > 0 &&
        row.specimenId.length <= 200 &&
        finite(row.displacementUm) &&
        Math.abs(row.displacementUm) <= 1e9 &&
        finite(row.forceMn) &&
        Math.abs(row.forceMn) <= 1e9,
      locale,
    );
    if (!specimens.has(row.specimenId)) specimens.set(row.specimenId, []);
    specimens.get(row.specimenId).push(row);
  }
  // Independent specimens, not the number of points, determine the sampling uncertainty.
  requireValue(specimens.size >= 3, locale, 'needSpecimens');
  const fits = [...specimens].map(([specimenId, rows]) => {
    requireValue(rows.length >= 3, locale, 'needPoints');
    const xbar = mean(rows.map((r) => r.displacementUm)),
      ybar = mean(rows.map((r) => r.forceMn));
    const sxx = rows.reduce((s, r) => s + (r.displacementUm - xbar) ** 2, 0);
    requireValue(sxx > 0, locale, 'needPoints');
    const slope =
      rows.reduce((s, r) => s + (r.displacementUm - xbar) * (r.forceMn - ybar), 0) / sxx;
    requireValue(positive(slope), locale, 'invalidSlope');
    const interceptMn = ybar - slope * xbar;
    const sse = rows.reduce(
      (s, r) => s + (r.forceMn - interceptMn - slope * r.displacementUm) ** 2,
      0,
    );
    const syy = rows.reduce((s, r) => s + (r.forceMn - ybar) ** 2, 0);
    return {
      specimenId,
      stiffnessNPerM: slope * 1000,
      interceptMn,
      rSquared: 1 - sse / syy,
      points: rows.length,
    };
  });
  const stiffness = mean(fits.map((f) => f.stiffnessNPerM));
  const sd = Math.sqrt(
    fits.reduce((s, f) => s + (f.stiffnessNPerM - stiffness) ** 2, 0) / (fits.length - 1),
  );
  const margin = (studentCritical(fits.length - 1) * sd) / Math.sqrt(fits.length);
  return {
    id: revision.id,
    conditions: revision.conditions,
    predictedStiffnessNPerM: revision.predictedStiffnessNPerM,
    meanStiffnessNPerM: stiffness,
    standardDeviationNPerM: sd,
    standardErrorNPerM: sd / Math.sqrt(fits.length),
    confidence95NPerM: [stiffness - margin, stiffness + margin],
    residualPercent: 100 * (stiffness / revision.predictedStiffnessNPerM - 1),
    specimenCount: fits.length,
    fits,
  };
}

export function compareRevisions(input, { locale = 'fr' } = {}) {
  message('notice', locale);
  requireValue(
    object(input) &&
      input.schemaVersion === 1 &&
      ['synthetic', 'user'].includes(input.origin) &&
      Array.isArray(input.revisions) &&
      input.revisions.length === 2 &&
      positive(input.minimumStiffnessNPerM),
    locale,
  );
  const [baseline, candidate] = input.revisions.map((r) => summarizeRevision(r, { locale }));
  requireValue(baseline.id !== candidate.id, locale);
  const findings = [];
  const comparable = canonical(baseline.conditions) === canonical(candidate.conditions);
  const linear = [...baseline.fits, ...candidate.fits].every((f) => f.rSquared >= 0.98);
  if (!comparable)
    findings.push({ code: 'conditionsChanged', message: message('conditionsChanged', locale) });
  if (!linear) findings.push({ code: 'nonlinear', message: message('nonlinear', locale) });
  const minimum = input.minimumStiffnessNPerM;
  const [low, high] = candidate.confidence95NPerM;
  const status =
    !comparable || !linear
      ? 'inconclusive'
      : low >= minimum
        ? 'pass'
        : high < minimum
          ? 'fail'
          : 'inconclusive';
  const delta = candidate.meanStiffnessNPerM - baseline.meanStiffnessNPerM;
  const deltaMargin =
    studentCritical(Math.min(baseline.specimenCount, candidate.specimenCount) - 1) *
    Math.hypot(baseline.standardErrorNPerM, candidate.standardErrorNPerM);
  findings.push({ code: status, message: message(status, locale) });
  return {
    schemaVersion: 1,
    locale,
    project: 'FabReplay',
    origin: input.origin,
    notice: message(input.origin === 'synthetic' ? 'notice' : 'userNotice', locale),
    summary: message('summary', locale, { baseline: baseline.id, candidate: candidate.id }),
    model: 'independent-specimen-linear-fit/student-t95',
    baseline,
    candidate,
    minimumStiffnessNPerM: minimum,
    comparable,
    changePercent: comparable ? (100 * delta) / baseline.meanStiffnessNPerM : null,
    differenceConfidence95NPerM: comparable ? [delta - deltaMargin, delta + deltaMargin] : null,
    status,
    findings,
  };
}

export function measurementsFromCsv(text, { locale = 'fr' } = {}) {
  requireValue(typeof text === 'string' && text.length <= 5000000, locale);
  const records = [];
  let row = [],
    cell = '',
    quoted = false,
    closed = false;
  for (let i = 0; i <= text.length; i++) {
    const c = text[i];
    if (quoted) {
      requireValue(c !== undefined, locale, 'invalidCsv');
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
        closed = true;
      } else cell += c;
    } else if (c === '"') {
      requireValue(cell === '' && !closed, locale, 'invalidCsv');
      quoted = true;
    } else if (c === ',' || c === '\n' || c === '\r' || c === undefined) {
      row.push(cell);
      cell = '';
      closed = false;
      if (c !== ',') {
        if (row.some((x) => x !== '')) records.push(row);
        row = [];
        if (c === '\r' && text[i + 1] === '\n') i++;
      }
    } else {
      requireValue(!closed, locale, 'invalidCsv');
      cell += c;
    }
  }
  requireValue(
    JSON.stringify(records.shift()) ===
      JSON.stringify(['specimen_id', 'displacement_um', 'force_mn']),
    locale,
    'invalidCsv',
  );
  return records.map((r) => {
    requireValue(
      r.length === 3 &&
        r[0].trim() !== '' &&
        r[1].trim() !== '' &&
        r[2].trim() !== '' &&
        finite(Number(r[1])) &&
        finite(Number(r[2])),
      locale,
      'invalidCsv',
    );
    return { specimenId: r[0], displacementUm: Number(r[1]), forceMn: Number(r[2]) };
  });
}
