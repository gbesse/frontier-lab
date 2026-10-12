import {
  begin,
  check,
  object,
  id,
  list,
  nonnegative,
  positive,
  indexed,
  report,
  row,
  finding,
} from './common.js';

export function analyze(input, { locale = 'fr' } = {}) {
  begin(input, locale);
  check(Number.isSafeInteger(input.budget) && input.budget >= 0 && id(input.costUnit), locale);
  const risks = indexed(input.risks, locale),
    measurements = indexed(input.measurements, locale);
  check(
    risks.size > 0 && risks.size <= 50 && measurements.size > 0 && measurements.size <= 20,
    locale,
  );
  for (const r of risks.values())
    check(
      nonnegative(r.probability) && r.probability <= 1 && positive(r.loss) && r.loss <= 1e12,
      locale,
    );
  for (const m of measurements.values()) {
    check(
      Number.isSafeInteger(m.cost) &&
        m.cost >= 0 &&
        m.cost <= 1e12 &&
        typeof m.mandatory === 'boolean' &&
        list(m.detection),
      locale,
    );
    const covered = new Set();
    for (const d of m.detection) {
      check(
        object(d) &&
          risks.has(d.riskId) &&
          !covered.has(d.riskId) &&
          nonnegative(d.sensitivity) &&
          d.sensitivity <= 1,
        locale,
      );
      covered.add(d.riskId);
    }
  }
  const all = [...measurements.values()].sort((a, b) => a.id.localeCompare(b.id)),
    mandatory = all.filter((m) => m.mandatory),
    optional = all.filter((m) => !m.mandatory);
  check(optional.length <= 18, locale);
  const baselineLoss = [...risks.values()].reduce((s, r) => s + r.probability * r.loss, 0),
    mandatoryCost = mandatory.reduce((s, m) => s + m.cost, 0);
  const loss = (selected) =>
    [...risks.values()].map((r) => {
      let remaining = 1;
      for (const m of selected)
        remaining *= 1 - (m.detection.find((d) => d.riskId === r.id)?.sensitivity ?? 0);
      return {
        id: r.id,
        probability: r.probability,
        remainingDetectionFraction: remaining,
        expectedLoss: r.probability * r.loss * remaining,
      };
    });
  if (mandatoryCost > input.budget)
    return report(
      'MeasurePlan',
      input,
      locale,
      'fail',
      all.map((m) =>
        row(
          m.id,
          m.mandatory ? 'blocked' : 'deferred',
          'budgetInsufficient',
          locale,
          { cost: mandatoryCost, budget: input.budget },
          m.cost,
        ),
      ),
      [finding('budgetInsufficient', locale, { cost: mandatoryCost, budget: input.budget })],
      {
        feasible: false,
        selected: [],
        unmetMandatory: mandatory.map((m) => m.id),
        budget: input.budget,
        costUnit: input.costUnit,
        baselineLoss,
        measurementCost: 0,
        residualLoss: null,
        totalExpectedCost: null,
        riskResults: [],
        evaluatedSubsets: 0,
      },
    );
  let best = null,
    evaluatedSubsets = 0;
  for (let mask = 0; mask < 2 ** optional.length; mask++) {
    const selected = [...mandatory];
    let cost = mandatoryCost;
    for (let i = 0; i < optional.length; i++)
      if (mask & (1 << i)) {
        selected.push(optional[i]);
        cost += optional[i].cost;
      }
    if (cost > input.budget) continue;
    evaluatedSubsets++;
    const riskResults = loss(selected),
      residualLoss = riskResults.reduce((s, r) => s + r.expectedLoss, 0),
      objective = cost + residualLoss;
    const ids = selected.map((m) => m.id).sort(),
      tie = JSON.stringify(ids);
    if (
      !best ||
      objective < best.objective - 1e-9 ||
      (Math.abs(objective - best.objective) <= 1e-9 &&
        (cost < best.cost || (cost === best.cost && tie < best.tie)))
    )
      best = { selected, ids, cost, objective, residualLoss, riskResults, tie };
  }
  const rows = all.map((m) => {
    const selected = best.ids.includes(m.id);
    const other = selected ? best.selected.filter((x) => x.id !== m.id) : [...best.selected, m];
    const alternateLoss = loss(other).reduce((s, r) => s + r.expectedLoss, 0);
    const marginalBenefit = selected
      ? alternateLoss - best.residualLoss
      : best.residualLoss - alternateLoss;
    return {
      ...row(
        m.id,
        selected ? 'selected' : 'deferred',
        m.mandatory ? 'mandatoryMeasure' : 'optionalMeasure',
        locale,
        { cost: m.cost, benefit: marginalBenefit.toFixed(2) },
        marginalBenefit,
      ),
      cost: m.cost,
      mandatory: m.mandatory,
    };
  });
  return report('MeasurePlan', input, locale, 'pass', rows, [], {
    feasible: true,
    selected: best.ids,
    unmetMandatory: [],
    budget: input.budget,
    costUnit: input.costUnit,
    baselineLoss,
    measurementCost: best.cost,
    residualLoss: best.residualLoss,
    totalExpectedCost: best.objective,
    riskResults: best.riskResults,
    evaluatedSubsets,
  });
}
