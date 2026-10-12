import { message } from './i18n.js';
import {
  begin,
  check,
  object,
  id,
  list,
  indexed,
  references,
  graph,
  ancestors,
  pathTo,
  canonical,
  iso,
  report,
  row,
  finding,
} from './common.js';

function revision(value, locale) {
  check(object(value) && id(value.id) && list(value.nodes) && value.nodes.length <= 500, locale);
  const g = graph(value.nodes, locale);
  for (const n of value.nodes)
    check(['material', 'operation', 'property'].includes(n.kind) && object(n.config), locale);
  const tests = indexed(value.tests, locale);
  check(tests.size <= 200, locale);
  for (const t of tests.values()) {
    references(t.dependsOn, g.map, locale);
    check(t.dependsOn.length > 0 && object(t.protocol) && typeof t.mandatory === 'boolean', locale);
  }
  return { ...g, tests };
}
function basis(t, g) {
  return {
    protocol: t.protocol,
    mandatory: t.mandatory,
    nodes: ancestors(t.dependsOn, g.map).map((k) => {
      const n = g.map.get(k);
      return { id: n.id, kind: n.kind, dependsOn: [...n.dependsOn].sort(), config: n.config };
    }),
    targets: [...t.dependsOn].sort(),
  };
}
/** Canonical evidence scope; store this object with the physical test result. */
export function basisFor(value, testId, { locale = 'fr' } = {}) {
  const g = revision(value, locale);
  check(g.tests.has(testId), locale, 'reference');
  return structuredClone(basis(g.tests.get(testId), g));
}
export function analyze(input, { locale = 'fr' } = {}) {
  begin(input, locale);
  check(iso(input.asOf), locale);
  const a = revision(input.baseline, locale),
    b = revision(input.candidate, locale),
    evidence = indexed(input.evidence, locale);
  for (const e of evidence.values())
    check(
      id(e.testId) &&
        (a.tests.has(e.testId) || b.tests.has(e.testId)) &&
        ['pass', 'fail'].includes(e.result) &&
        object(e.basis) &&
        iso(e.measuredAt) &&
        Date.parse(e.measuredAt) <= Date.parse(input.asOf),
      locale,
    );
  const changedNodes = [...new Set([...a.map.keys(), ...b.map.keys()])].sort().filter((k) => {
    const normalize = (n) =>
      n ? { kind: n.kind, config: n.config, dependsOn: [...n.dependsOn].sort() } : null;
    return canonical(normalize(a.map.get(k))) !== canonical(normalize(b.map.get(k)));
  });
  const tests = [],
    rows = [],
    findings = [];
  let failed = false,
    unresolved = false;
  for (const t of b.tests.values()) {
    const currentBasis = basis(t, b),
      prior = a.tests.get(t.id),
      impacts = [];
    for (const node of changedNodes) {
      const after = pathTo(node, new Set(t.dependsOn), b.children);
      const before = prior ? pathTo(node, new Set(prior.dependsOn), a.children) : null;
      if (after || before)
        impacts.push({ node, path: after ?? before, scope: after ? 'candidate' : 'baseline' });
    }
    const candidates = [...evidence.values()].filter(
      (e) => e.testId === t.id && canonical(e.basis) === canonical(currentBasis),
    );
    const latest = candidates.reduce((at, e) => Math.max(at, Date.parse(e.measuredAt)), -Infinity);
    const fresh = candidates.filter((e) => Date.parse(e.measuredAt) === latest);
    const state = fresh.some((e) => e.result === 'fail')
      ? 'failed'
      : fresh.length
        ? 'retained'
        : 'retest';
    const staleEvidence = [...evidence.values()]
      .filter((e) => e.testId === t.id && canonical(e.basis) !== canonical(currentBasis))
      .map((e) => e.id);
    failed ||= state === 'failed';
    unresolved ||= state === 'retest';
    rows.push(
      row(
        t.id,
        state,
        state === 'retained'
          ? 'evidenceCurrent'
          : state === 'failed'
            ? 'evidenceFailed'
            : 'evidenceNeeded',
        locale,
        { count: impacts.length },
        impacts.length,
      ),
    );
    tests.push({
      id: t.id,
      state,
      mandatory: t.mandatory,
      impacts,
      protocolChanged: !!prior && canonical(prior.protocol) !== canonical(t.protocol),
      evidence: fresh.map((e) => e.id),
      staleEvidence,
      basis: currentBasis,
    });
  }
  const removedTests = [...a.tests.values()]
    .filter((t) => !b.tests.has(t.id))
    .map((t) => ({ id: t.id, mandatory: t.mandatory }));
  for (const t of removedTests)
    if (t.mandatory) {
      unresolved = true;
      rows.push(row(t.id, 'review', 'mandatoryRemoved', locale, { id: t.id }));
      findings.push(finding('mandatoryRemoved', locale, { id: t.id }));
    }
  const covered = new Set([...b.tests.values()].flatMap((t) => ancestors(t.dependsOn, b.map)));
  const untestedChanges = changedNodes.filter((k) => b.map.has(k) && !covered.has(k));
  if (untestedChanges.length) {
    unresolved = true;
    findings.push(finding('untestedChange', locale, { ids: untestedChanges.join(', ') }));
  }
  if (!b.tests.size) {
    unresolved = true;
    findings.push(finding('noTests', locale));
  }
  return report(
    'QualifyDiff',
    input,
    locale,
    failed ? 'fail' : unresolved ? 'inconclusive' : 'pass',
    rows,
    findings,
    { changedNodes, tests, removedTests, untestedChanges },
  );
}
