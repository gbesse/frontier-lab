import { createHash } from 'node:crypto';

const locales = ['fr', 'en', 'es'];
const words = {
  invalid: ['Données invalides.', 'Invalid data.', 'Datos no válidos.'],
  notice: [
    'Exercice hors ligne sur des moyens déclarés. Ni disponibilité réelle, ni autorité juridique, ni aptitude à répondre à une crise ne sont vérifiées. Ne pas utiliser pour déclencher des secours.',
    'Offline exercise on declared resources. Actual availability, legal authority and crisis readiness are not verified. Do not use to dispatch emergency services.',
    'Ejercicio sin conexión sobre recursos declarados. No se verifican la disponibilidad real, la autoridad jurídica ni la preparación ante una crisis. No usar para movilizar servicios de emergencia.',
  ],
  summary: [
    '{runs} exécution(s), {demands} besoin(s), {issues} point(s) à examiner.',
    '{runs} run(s), {demands} demand(s), {issues} finding(s) to review.',
    '{runs} ejecución(es), {demands} necesidad(es), {issues} punto(s) por revisar.',
  ],
  AUTHORIZATION_UNDOCUMENTED: [
    'Mise à disposition intercommunale non documentée.',
    'Cross-commune release is undocumented.',
    'La cesión entre municipios no está documentada.',
  ],
  KIND_MISMATCH: [
    'Type de moyen incompatible avec le besoin.',
    'Resource kind does not match the demand.',
    'El tipo de recurso no coincide con la necesidad.',
  ],
  OUTSIDE_DEMAND: [
    'Affectation hors de la période du besoin.',
    'Assignment falls outside the demand window.',
    'La asignación queda fuera del período de necesidad.',
  ],
  RESOURCE_UNAVAILABLE: [
    'Moyen affecté mais indisponible sur cette période.',
    'Assigned resource is unavailable during this period.',
    'El recurso asignado no está disponible en este período.',
  ],
  CAPACITY_CONFLICT: [
    'Plusieurs affectations réclament une capacité supérieure à celle disponible ; aucune priorité n’est supposée.',
    'Assignments claim more than available capacity; no priority is assumed.',
    'Las asignaciones reclaman más capacidad de la disponible; no se presupone ninguna prioridad.',
  ],
  UNMET_DEMAND: [
    'Besoin non couvert par des affectations non contestées.',
    'Demand is not covered by uncontested assignments.',
    'La necesidad no está cubierta por asignaciones no disputadas.',
  ],
};
const say = (key, locale, values = {}) => {
  const index = locales.indexOf(locale);
  if (index < 0) throw Error('Locale / Langue / Idioma: fr, en, es');
  return words[key][index].replace(/\{(\w+)\}/g, (_, field) => values[field]);
};
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;
const positive = (value) => Number.isSafeInteger(value) && value > 0;
const stamp = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value) &&
  new Date(value).toISOString().replace('.000Z', 'Z') === value;
const period = (value) => stamp(value.from) && stamp(value.to) && value.from < value.to;
const overlap = (left, right) => left.from < right.to && right.from < left.to;
const active = (value, from, to) => value.from < to && from < value.to;
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const unique = (rows) => new Set(rows.map((row) => row.id)).size === rows.length;

function validate(input) {
  if (
    !object(input) ||
    !Array.isArray(input.communes) ||
    input.communes.length === 0 ||
    !Array.isArray(input.resources) ||
    input.resources.length === 0 ||
    !Array.isArray(input.demands) ||
    input.demands.length === 0 ||
    !Array.isArray(input.runs) ||
    input.runs.length === 0 ||
    !nonempty(input.baselineRunId) ||
    ![input.communes, input.resources, input.demands, input.runs].every(unique)
  )
    throw Error('invalid');
  const communeIds = new Set(input.communes.map((row) => row.id));
  const resources = new Map(input.resources.map((row) => [row.id, row]));
  const demands = new Map(input.demands.map((row) => [row.id, row]));
  if (
    input.communes.some((row) => !object(row) || !nonempty(row.id)) ||
    input.resources.some(
      (row) =>
        !object(row) ||
        !nonempty(row.id) ||
        !communeIds.has(row.ownerCommuneId) ||
        !nonempty(row.kind) ||
        !positive(row.capacity) ||
        !period(row),
    ) ||
    input.demands.some(
      (row) =>
        !object(row) ||
        !nonempty(row.id) ||
        !communeIds.has(row.communeId) ||
        !nonempty(row.kind) ||
        !positive(row.quantity) ||
        !period(row),
    ) ||
    !input.runs.some((row) => row.id === input.baselineRunId)
  )
    throw Error('invalid');
  for (const run of input.runs) {
    if (
      !object(run) ||
      !nonempty(run.id) ||
      !Array.isArray(run.assignments) ||
      !Array.isArray(run.failures) ||
      !unique(run.assignments)
    )
      throw Error('invalid');
    for (const row of run.assignments)
      if (
        !object(row) ||
        !nonempty(row.id) ||
        !demands.has(row.demandId) ||
        !resources.has(row.resourceId) ||
        !positive(row.quantity) ||
        !period(row) ||
        (row.authorizedBy !== undefined && !nonempty(row.authorizedBy)) ||
        (row.authorizationRef !== undefined && !nonempty(row.authorizationRef))
      )
        throw Error('invalid');
    for (const row of run.failures)
      if (
        !object(row) ||
        !resources.has(row.resourceId) ||
        !period(row) ||
        !positive(row.lostCapacity) ||
        row.lostCapacity > resources.get(row.resourceId).capacity
      )
        throw Error('invalid');
    for (let index = 0; index < run.failures.length; index++)
      if (
        run.failures
          .slice(index + 1)
          .some(
            (row) =>
              row.resourceId === run.failures[index].resourceId &&
              overlap(row, run.failures[index]),
          )
      )
        throw Error('invalid');
  }
  return { resources, demands };
}

function evaluateRun(run, input, maps, locale) {
  const findings = [];
  const add = (code, ref, extra = {}) => {
    const previous = findings.findLast(
      (item) =>
        item.code === code &&
        item.ref === ref &&
        item.to === extra.from &&
        item.missing === extra.missing &&
        item.claimed === extra.claimed &&
        item.available === extra.available,
    );
    if (previous && extra.to) previous.to = extra.to;
    else findings.push({ code, message: say(code, locale), ref, ...extra });
  };
  const assignments = run.assignments.map((row, index) => {
    const demand = maps.demands.get(row.demandId);
    const resource = maps.resources.get(row.resourceId);
    const ref = `runs.${run.id}.assignments.${index}`;
    let eligible = true;
    if (row.from < demand.from || row.to > demand.to) {
      add('OUTSIDE_DEMAND', ref);
      eligible = false;
    }
    if (resource.kind !== demand.kind) {
      add('KIND_MISMATCH', ref);
      eligible = false;
    }
    if (
      resource.ownerCommuneId !== demand.communeId &&
      (row.authorizedBy !== resource.ownerCommuneId || !nonempty(row.authorizationRef))
    ) {
      add('AUTHORIZATION_UNDOCUMENTED', ref);
      eligible = false;
    }
    return { ...row, eligible };
  });
  const boundaries = [
    ...input.demands.flatMap((row) => [row.from, row.to]),
    ...input.resources.flatMap((row) => [row.from, row.to]),
    ...assignments.flatMap((row) => [row.from, row.to]),
    ...run.failures.flatMap((row) => [row.from, row.to]),
  ];
  const times = [...new Set(boundaries)].sort();
  let unmetUnitMinutes = 0;
  let conflictMinutes = 0;
  for (let index = 0; index < times.length - 1; index++) {
    const [from, to] = [times[index], times[index + 1]];
    const minutes = (Date.parse(to) - Date.parse(from)) / 60000;
    const contested = new Set();
    const unavailable = new Set();
    for (const resource of input.resources) {
      const current = assignments.filter(
        (row) => row.eligible && row.resourceId === resource.id && active(row, from, to),
      );
      if (!current.length) continue;
      const loss =
        run.failures.find((row) => row.resourceId === resource.id && active(row, from, to))
          ?.lostCapacity ?? 0;
      const available = resource.from <= from && to <= resource.to ? resource.capacity - loss : 0;
      const claimed = current.reduce((sum, row) => sum + row.quantity, 0);
      if (available === 0) {
        unavailable.add(resource.id);
        add('RESOURCE_UNAVAILABLE', `resources.${resource.id}`, { from, to });
      } else if (claimed > available) {
        contested.add(resource.id);
        conflictMinutes += minutes;
        add('CAPACITY_CONFLICT', `resources.${resource.id}`, { from, to, claimed, available });
      }
    }
    for (const demand of input.demands) {
      if (!active(demand, from, to)) continue;
      const covered = assignments
        .filter(
          (row) =>
            row.eligible &&
            row.demandId === demand.id &&
            active(row, from, to) &&
            !contested.has(row.resourceId) &&
            !unavailable.has(row.resourceId),
        )
        .reduce((sum, row) => sum + row.quantity, 0);
      const missing = Math.max(0, demand.quantity - covered);
      if (missing) {
        unmetUnitMinutes += missing * minutes;
        add('UNMET_DEMAND', `demands.${demand.id}`, { from, to, missing });
      }
    }
  }
  return { id: run.id, unmetUnitMinutes, conflictMinutes, findings };
}

export function runPicsExercise(input, { locale = 'fr' } = {}) {
  say('invalid', locale);
  try {
    const maps = validate(input);
    const runs = input.runs.map((run) => evaluateRun(run, input, maps, locale));
    const baseline = runs.find((run) => run.id === input.baselineRunId);
    for (const run of runs) {
      run.deltaUnmetUnitMinutes = run.unmetUnitMinutes - baseline.unmetUnitMinutes;
      run.deltaConflictMinutes = run.conflictMinutes - baseline.conflictMinutes;
    }
    return {
      schemaVersion: 1,
      locale,
      baselineRunId: input.baselineRunId,
      inputSha256: hash(input),
      notice: say('notice', locale),
      summary: say('summary', locale, {
        runs: runs.length,
        demands: input.demands.length,
        issues: runs.reduce((sum, run) => sum + run.findings.length, 0),
      }),
      runs,
    };
  } catch {
    throw Error(say('invalid', locale));
  }
}
