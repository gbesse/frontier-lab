import {
  begin,
  check,
  object,
  id,
  list,
  finite,
  nonnegative,
  indexed,
  graph,
  iso,
  numericRange,
  report,
  row,
  finding,
} from './common.js';

function logChoose(n, k) {
  if (k < 0 || k > n) return -Infinity;
  let s = 0;
  for (let i = 1; i <= Math.min(k, n - k); i++) s += Math.log(n - i + 1) - Math.log(i);
  return s;
}
/** Two-sided Fisher test, fixed margins. Association only. */
export function fisherExact(a, b, c, d) {
  if (![a, b, c, d].every((n) => Number.isSafeInteger(n) && n >= 0) || a + b + c + d > 2000)
    throw Error('FR : effectifs invalides. EN: invalid counts. ES: recuentos no válidos.');
  const n = a + b + c + d,
    exposed = a + b,
    failed = a + c;
  if (!n) return 1;
  const logP = (x) =>
      logChoose(failed, x) + logChoose(n - failed, exposed - x) - logChoose(n, exposed),
    observed = logP(a);
  let p = 0;
  for (let x = Math.max(0, exposed - (n - failed)); x <= Math.min(exposed, failed); x++) {
    const lp = logP(x);
    if (lp <= observed + 1e-10) p += Math.exp(lp);
  }
  return Math.min(1, p);
}
export function analyze(input, { locale = 'fr' } = {}) {
  begin(input, locale);
  const g = graph(input.operations, locale),
    requirements = indexed(input.requirements, locale),
    parts = indexed(input.parts, locale);
  check(
    g.map.size > 0 &&
      g.map.size <= 100 &&
      requirements.size > 0 &&
      requirements.size <= 100 &&
      parts.size > 0 &&
      parts.size <= 500,
    locale,
  );
  for (const r of requirements.values()) {
    check(g.map.has(r.operationId) && id(r.metric) && id(r.unit), locale);
    numericRange(r.limits, locale);
  }
  const traces = [],
    rows = [],
    findings = [];
  for (const p of parts.values()) {
    check(object(p.facts) && Object.keys(p.facts).length <= 50, locale);
    for (const [key, value] of Object.entries(p.facts)) check(id(key) && id(value), locale);
    const events = indexed(p.events, locale),
      measurements = indexed(p.measurements, locale);
    check(events.size <= 500 && measurements.size <= 500, locale);
    const running = new Map(),
      finished = new Map(),
      issues = [],
      timeline = [];
    let seq = -1,
      time = -Infinity;
    for (const e of events.values()) {
      check(
        g.map.has(e.operationId) &&
          ['start', 'finish'].includes(e.type) &&
          Number.isSafeInteger(e.seq) &&
          e.seq >= 0 &&
          iso(e.time) &&
          object(e.parameters),
        locale,
      );
      const at = Date.parse(e.time);
      if (e.seq <= seq || at < time) issues.push({ code: 'eventOrder', eventId: e.id });
      seq = e.seq;
      time = at;
      if (e.type === 'start') {
        if (running.has(e.operationId) || finished.has(e.operationId))
          issues.push({ code: 'repeatedOperation', eventId: e.id });
        const missing = g.map.get(e.operationId).dependsOn.filter((k) => !finished.has(k));
        if (missing.length) issues.push({ code: 'dependencyMissing', eventId: e.id, missing });
        running.set(e.operationId, e);
        timeline.push({ ...e, durationMs: null });
      } else {
        const start = running.get(e.operationId);
        if (!start) issues.push({ code: 'startMissing', eventId: e.id });
        const durationMs = start ? at - Date.parse(start.time) : null;
        if (durationMs !== null && durationMs < 0)
          issues.push({ code: 'eventOrder', eventId: e.id });
        timeline.push({ ...e, durationMs });
        running.delete(e.operationId);
        finished.set(e.operationId, e);
      }
    }
    for (const k of g.order)
      if (!finished.has(k)) issues.push({ code: 'operationMissing', operationId: k });
    const results = [];
    for (const m of measurements.values())
      check(
        requirements.has(m.requirementId) &&
          finite(m.value) &&
          nonnegative(m.uncertainty95) &&
          id(m.unit),
        locale,
      );
    for (const r of requirements.values()) {
      const readings = [...measurements.values()].filter((m) => m.requirementId === r.id);
      let state = 'pass';
      if (!readings.length) state = 'inconclusive';
      for (const m of readings) {
        if (m.unit !== r.unit) {
          if (state !== 'fail') state = 'inconclusive';
        } else if (
          m.value + m.uncertainty95 < r.limits.min ||
          m.value - m.uncertainty95 > r.limits.max
        )
          state = 'fail';
        else if (
          (m.value - m.uncertainty95 < r.limits.min || m.value + m.uncertainty95 > r.limits.max) &&
          state !== 'fail'
        )
          state = 'inconclusive';
      }
      results.push({ id: r.id, state, readings: structuredClone(readings) });
    }
    const outcome = results.some((r) => r.state === 'fail')
      ? 'fail'
      : results.some((r) => r.state === 'inconclusive')
        ? 'inconclusive'
        : 'pass';
    const cohortEligible = issues.length === 0 && outcome !== 'inconclusive';
    const state =
      issues.length || outcome === 'inconclusive'
        ? 'unknown'
        : outcome === 'fail'
          ? 'defective'
          : 'conforming';
    traces.push({
      id: p.id,
      facts: structuredClone(p.facts),
      outcome,
      cohortEligible,
      issues,
      timeline,
      results,
    });
    rows.push(
      row(
        p.id,
        state,
        'traceResult',
        locale,
        { count: issues.length },
        timeline
          .filter((e) => e.type === 'finish' && e.durationMs !== null)
          .reduce((s, e) => s + Math.max(0, e.durationMs), 0),
      ),
    );
    for (const issue of issues) findings.push(finding(issue.code, locale, { id: p.id }));
  }
  const cohort = traces.filter((p) => p.cohortEligible),
    associations = [];
  const keys = [...new Set(cohort.flatMap((p) => Object.keys(p.facts)))].sort();
  for (const key of keys) {
    const observed = cohort.filter((p) => Object.hasOwn(p.facts, key));
    for (const value of [...new Set(observed.map((p) => p.facts[key]))].sort()) {
      const exposed = observed.filter((p) => p.facts[key] === value),
        other = observed.filter((p) => p.facts[key] !== value);
      if (exposed.length < 2 || other.length < 2) continue;
      const a = exposed.filter((p) => p.outcome === 'fail').length,
        b = exposed.length - a,
        c = other.filter((p) => p.outcome === 'fail').length,
        d = other.length - c;
      const pValue = fisherExact(a, b, c, d);
      associations.push({
        key,
        value,
        exposedFailed: a,
        exposedPassed: b,
        otherFailed: c,
        otherPassed: d,
        riskDifference: a / (a + b) - c / (c + d),
        oddsRatio: ((a + 0.5) * (d + 0.5)) / ((b + 0.5) * (c + 0.5)),
        pValue,
        exposedPartIds: exposed.map((p) => p.id),
        otherPartIds: other.map((p) => p.id),
      });
    }
  }
  for (const a of associations) a.adjustedPValue = Math.min(1, a.pValue * associations.length);
  associations.sort(
    (a, b) =>
      b.riskDifference - a.riskDifference ||
      a.adjustedPValue - b.adjustedPValue ||
      a.key.localeCompare(b.key) ||
      a.value.localeCompare(b.value),
  );
  if (associations.length) findings.push(finding('associationOnly', locale));
  if (cohort.length < parts.size)
    findings.push(finding('cohortExcluded', locale, { count: parts.size - cohort.length }));
  const status = traces.some((p) => p.outcome === 'fail')
    ? 'fail'
    : traces.some((p) => !p.cohortEligible)
      ? 'inconclusive'
      : 'pass';
  return report('FabTrace', input, locale, status, rows, findings, {
    traces,
    associations,
    cohortSize: cohort.length,
    excludedParts: traces.filter((p) => !p.cohortEligible).map((p) => p.id),
  });
}
