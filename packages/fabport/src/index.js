import {
  begin,
  check,
  object,
  id,
  list,
  positive,
  finite,
  indexed,
  iso,
  numericRange,
  report,
  row,
  finding,
} from './common.js';

function capability(c, locale) {
  check(
    id(c.operation) && id(c.material) && (c.maxErrorUm === null || positive(c.maxErrorUm)),
    locale,
  );
  if (c.range !== null) {
    numericRange(c.range, locale);
    check(id(c.range.unit), locale);
  }
  if (c.evidence !== null) {
    const e = c.evidence;
    check(
      object(e) &&
        id(e.id) &&
        id(e.calibrationId) &&
        typeof e.qualified === 'boolean' &&
        iso(e.validFrom) &&
        iso(e.validUntil) &&
        Date.parse(e.validFrom) <= Date.parse(e.validUntil),
      locale,
    );
  }
}
function evaluate(r, c, asOf, locale) {
  const reasons = [];
  let incompatible = false,
    unknown = false;
  if (c.maxErrorUm === null) {
    unknown = true;
    reasons.push('precisionUnknown');
  } else if (c.maxErrorUm > r.maxErrorUm) {
    incompatible = true;
    reasons.push('precisionExceeded');
  }
  if (c.range === null || c.range.unit !== r.range.unit) {
    unknown = true;
    reasons.push('rangeUnknown');
  } else if (c.range.min > r.range.min || c.range.max < r.range.max) {
    incompatible = true;
    reasons.push('rangeExceeded');
  }
  if (
    !c.evidence ||
    !c.evidence.qualified ||
    Date.parse(asOf) < Date.parse(c.evidence.validFrom) ||
    Date.parse(asOf) > Date.parse(c.evidence.validUntil)
  ) {
    unknown = true;
    reasons.push('evidenceExpired');
  }
  return {
    state: incompatible ? 'incompatible' : unknown ? 'unknown' : 'compatible',
    reasons,
    capabilityId: c.id,
    evidenceId: c.evidence?.id ?? null,
  };
}
export function analyze(input, { locale = 'fr' } = {}) {
  begin(input, locale);
  check(iso(input.asOf), locale);
  const requirements = indexed(input.requirements, locale),
    fabs = indexed(input.fabs, locale),
    substitutions = indexed(input.substitutions, locale);
  check(
    requirements.size > 0 &&
      requirements.size <= 100 &&
      fabs.size > 0 &&
      fabs.size <= 50 &&
      substitutions.size <= 100,
    locale,
  );
  for (const r of requirements.values()) {
    check(id(r.operation) && id(r.material) && positive(r.maxErrorUm), locale);
    numericRange(r.range, locale);
    check(id(r.range.unit), locale);
  }
  for (const s of substitutions.values())
    check([s.fromOperation, s.toOperation, s.fromMaterial, s.toMaterial].every(id), locale);
  const profiles = [],
    rows = [],
    findings = [];
  for (const f of fabs.values()) {
    check(typeof f.complete === 'boolean', locale);
    const caps = indexed(f.capabilities, locale);
    check(caps.size <= 500, locale);
    for (const c of caps.values()) capability(c, locale);
    const steps = [];
    for (const r of requirements.values()) {
      const exact = [...caps.values()]
        .filter((c) => c.operation === r.operation && c.material === r.material)
        .map((c) => evaluate(r, c, input.asOf, locale));
      const options = [...exact];
      for (const s of substitutions.values())
        if (s.fromOperation === r.operation && s.fromMaterial === r.material)
          for (const c of caps.values())
            if (c.operation === s.toOperation && c.material === s.toMaterial) {
              const alt = evaluate(r, c, input.asOf, locale);
              options.push({
                ...alt,
                state: alt.state === 'compatible' ? 'adaptation' : alt.state,
                substitutionId: s.id,
                reasons:
                  alt.state === 'compatible' ? ['substitutionNeedsQualification'] : alt.reasons,
              });
            }
      const rank = { compatible: 0, adaptation: 1, unknown: 2, incompatible: 3 };
      options.sort(
        (a, b) => rank[a.state] - rank[b.state] || a.capabilityId.localeCompare(b.capabilityId),
      );
      let selected = options[0];
      if (!selected)
        selected = {
          state: f.complete ? 'incompatible' : 'unknown',
          reasons: [f.complete ? 'operationMissing' : 'profileIncomplete'],
          capabilityId: null,
          evidenceId: null,
        };
      else if (selected.state === 'incompatible' && !f.complete)
        selected = {
          state: 'unknown',
          reasons: ['profileIncomplete'],
          capabilityId: null,
          evidenceId: null,
        };
      steps.push({ id: r.id, ...selected, options });
    }
    const state = steps.some((s) => s.state === 'incompatible')
      ? 'incompatible'
      : steps.some((s) => s.state === 'unknown')
        ? 'unknown'
        : steps.some((s) => s.state === 'adaptation')
          ? 'adaptation'
          : 'compatible';
    profiles.push({ id: f.id, state, steps });
    rows.push(
      row(
        f.id,
        state,
        'profileResult',
        locale,
        { compatible: steps.filter((s) => s.state === 'compatible').length, total: steps.length },
        steps.filter((s) => s.state === 'compatible').length,
      ),
    );
    for (const step of steps)
      for (const reason of step.reasons)
        findings.push(finding(reason, locale, { fab: f.id, step: step.id }));
  }
  const status = profiles.some((f) => f.state === 'compatible')
    ? 'pass'
    : profiles.every((f) => f.state === 'incompatible')
      ? 'fail'
      : 'inconclusive';
  return report('FabPort', input, locale, status, rows, findings, { asOf: input.asOf, profiles });
}
