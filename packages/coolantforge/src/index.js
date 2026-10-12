import { message } from './i18n.js';
import { requireValue, positive, finite, object } from './validate.js';

export function validatePlate(input, locale = 'fr') {
  requireValue(
    object(input) && input.schemaVersion === 1 && ['synthetic', 'user'].includes(input.origin),
    locale,
  );
  requireValue(
    [
      'plateWidthMm',
      'plateLengthMm',
      'channelDepthMm',
      'baseThicknessMm',
      'flowMlMin',
      'maxPumpW',
      'minFeatureMm',
      'conductivityWmK',
    ].every((k) => positive(input[k])) && finite(input.inletC),
    locale,
  );
  requireValue(
    Array.isArray(input.zones) &&
      input.zones.length >= 1 &&
      input.zones.length <= 20 &&
      input.plateWidthMm >= 1 &&
      input.plateWidthMm <= 500 &&
      input.plateLengthMm >= 1 &&
      input.plateLengthMm <= 500 &&
      input.channelDepthMm >= 0.01 &&
      input.channelDepthMm <= 10 &&
      input.minFeatureMm >= 0.01 &&
      input.minFeatureMm < input.plateWidthMm &&
      input.flowMlMin <= 10000 &&
      input.flowMlMin >= 0.1 &&
      input.maxPumpW <= 10000 &&
      input.baseThicknessMm <= 100 &&
      input.conductivityWmK <= 1000 &&
      input.inletC >= 0 &&
      input.inletC <= 60,
    locale,
  );
  const names = new Set();
  for (const z of input.zones) {
    requireValue(
      object(z) &&
        typeof z.id === 'string' &&
        z.id.length > 0 &&
        z.id.length <= 100 &&
        !names.has(z.id) &&
        positive(z.powerW) &&
        z.powerW <= 100000,
      locale,
    );
    names.add(z.id);
  }
  return input;
}

export function evaluateDesign(input, channelsPerZone, { locale = 'fr' } = {}) {
  validatePlate(input, locale);
  requireValue(
    Array.isArray(channelsPerZone) &&
      channelsPerZone.length === input.zones.length &&
      channelsPerZone.every((n) => Number.isInteger(n) && n >= 1 && n <= 64),
    locale,
  );
  // Parallel equal-width zones. Constant water properties, laminar rectangular ducts.
  const mu = 0.001,
    rho = 997,
    cp = 4180,
    waterK = 0.6;
  const zoneWidth = (input.plateWidthMm * 1e-3) / input.zones.length;
  const length = input.plateLengthMm * 1e-3,
    height = input.channelDepthMm * 1e-3,
    wall = input.minFeatureMm * 1e-3;
  const totalFlow = (input.flowMlMin * 1e-6) / 60;
  const geometries = channelsPerZone.map((count) => {
    const width = (zoneWidth - (count + 1) * wall) / count;
    if (width < wall) return null;
    const a = Math.min(width, height),
      b = Math.max(width, height),
      ratio = a / b;
    const correction = 1 - 0.63 * ratio + 0.053 * ratio ** 5;
    const resistance = (12 * mu * length) / (b * a ** 3 * correction);
    return { count, width, resistance, conductance: count / resistance };
  });
  if (geometries.some((g) => !g))
    return { channelsPerZone, feasible: false, reasons: ['featureLimit'] };
  const conductance = geometries.reduce((s, g) => s + g.conductance, 0),
    pressurePa = totalFlow / conductance;
  const zones = geometries.map((g, i) => {
    const flowM3S = pressurePa * g.conductance,
      velocity = flowM3S / g.count / (g.width * height);
    const dh = (2 * g.width * height) / (g.width + height),
      reynolds = (rho * velocity * dh) / mu;
    const ratio = Math.min(g.width, height) / Math.max(g.width, height);
    // Fully developed, uniform wall heat flux on all four walls (Shah–London polynomial).
    const nu =
      8.235 *
      (1 -
        2.0421 * ratio +
        3.0853 * ratio ** 2 -
        2.4765 * ratio ** 3 +
        1.0578 * ratio ** 4 -
        0.1861 * ratio ** 5);
    const h = (nu * waterK) / dh,
      area = g.count * 2 * (g.width + height) * length;
    const power = input.zones[i].powerW;
    const bulkRise = power / (rho * cp * flowM3S);
    const convectionRise = power / (h * area);
    const conductionRise =
      (power * input.baseThicknessMm * 1e-3) / (input.conductivityWmK * zoneWidth * length);
    return {
      id: input.zones[i].id,
      channels: g.count,
      widthMm: g.width * 1000,
      flowMlMin: flowM3S * 60 * 1e6,
      reynolds,
      nusselt: nu,
      outletC: input.inletC + bulkRise,
      estimatedWallC: input.inletC + bulkRise + convectionRise + conductionRise,
    };
  });
  const pumpW = pressurePa * totalFlow;
  const reasons = [];
  if (pumpW > input.maxPumpW) reasons.push('pumpLimit');
  if (zones.some((z) => z.reynolds > 2000)) reasons.push('laminarLimit');
  if (zones.some((z) => z.estimatedWallC > 80)) reasons.push('temperatureLimit');
  return {
    channelsPerZone,
    feasible: reasons.length === 0,
    reasons,
    pressurePa,
    hydraulicPumpW: pumpW,
    totalFlowMlMin: input.flowMlMin,
    maxWallC: Math.max(...zones.map((z) => z.estimatedWallC)),
    zones,
  };
}

export function optimizePlate(input, { locale = 'fr' } = {}) {
  message('notice', locale);
  validatePlate(input, locale);
  const allocations = [];
  // Deliberately bounded catalogue search, not arbitrary topology optimization.
  for (const base of [2, 4, 6, 8, 12, 16, 24]) {
    allocations.push(input.zones.map(() => base));
    for (const focused of input.zones.keys())
      allocations.push(input.zones.map((_, i) => (i === focused ? Math.min(64, base * 2) : base)));
    const average = input.zones.reduce((s, z) => s + z.powerW, 0) / input.zones.length;
    allocations.push(
      input.zones.map((z) => Math.min(64, Math.max(1, Math.round((base * z.powerW) / average)))),
    );
  }
  const unique = [...new Map(allocations.map((a) => [a.join(','), a])).values()];
  const designs = unique.map((a) => evaluateDesign(input, a, { locale }));
  const feasible = designs.filter((d) => d.feasible);
  const pareto = feasible
    .filter(
      (d) =>
        !feasible.some(
          (other) =>
            other !== d &&
            other.maxWallC <= d.maxWallC &&
            other.hydraulicPumpW <= d.hydraulicPumpW &&
            (other.maxWallC < d.maxWallC || other.hydraulicPumpW < d.hydraulicPumpW),
        ),
    )
    .sort((a, b) => a.maxWallC - b.maxWallC);
  const best = pareto[0] ?? null;
  return {
    schemaVersion: 1,
    locale,
    project: 'CoolantForge',
    origin: input.origin,
    notice: message('notice', locale),
    summary: message('summary', locale, { count: designs.length, feasible: feasible.length }),
    model: 'parallel-zones/laminar-rectangular-ducts/constant-water-properties',
    inputs: input,
    designs,
    pareto,
    best,
    findings: [
      {
        code: best ? 'reducedModel' : 'noFeasible',
        message: message(best ? 'reducedModel' : 'noFeasible', locale),
      },
    ],
  };
}

export function channelSvg(input, design) {
  const width = 900,
    height = 360,
    zoneWidth = width / input.zones.length;
  const colors = ['#b8edcd', '#f0c477', '#8cbeef', '#e7a9d2'];
  const rects = design.zones
    .flatMap((z, i) =>
      Array.from({ length: z.channels }, (_, j) => {
        const channelW = (z.widthMm / input.plateWidthMm) * width;
        const x =
          i * zoneWidth +
          ((input.minFeatureMm + j * (z.widthMm + input.minFeatureMm)) / input.plateWidthMm) *
            width;
        return `<rect x="${x}" y="20" width="${channelW}" height="320" rx="3" fill="${colors[i % colors.length]}"/>`;
      }),
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img"><rect width="900" height="360" fill="#111918"/>${rects}</svg>`;
}
