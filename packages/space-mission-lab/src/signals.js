import { fingerprint } from '@gbesse/branch-lab';
import { number, integer, requireInput } from './frontier-checks.js';
import { say } from './i18n.js';
export function syntheticSignals(seed = 1, inject = true) {
  requireInput(integer(seed, 0, 0xffffffff) && typeof inject === 'boolean');
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const on = Array.from({ length: 3 }, () => Array.from({ length: 32 }, () => 1 + random() * 0.5));
  const off = Array.from({ length: 3 }, () => Array.from({ length: 32 }, () => 1 + random() * 0.5));
  for (let frame = 0; frame < 3; frame++) {
    if (inject) on[frame][8 + frame] += 12;
    on[frame][22] += 16;
    off[frame][22] += 16;
  }
  return { on, off, seed };
}
export function searchSignals(input, { locale = 'fr', maxDrift = 2, threshold = 8 } = {}) {
  say('frontierInvalid', locale);
  requireInput(
    input &&
      Array.isArray(input.on) &&
      input.on.length >= 2 &&
      input.on.length <= 16 &&
      Array.isArray(input.off) &&
      input.off.length === input.on.length &&
      integer(maxDrift, 0, 5) &&
      number(threshold, 0.1, 1e6),
    locale,
  );
  const bins = input.on[0]?.length;
  requireInput(
    integer(bins, 4, 128) &&
      [...input.on, ...input.off].every(
        (row) =>
          Array.isArray(row) && row.length === bins && row.every((value) => number(value, 0, 1e6)),
      ),
    locale,
  );
  const detections = [];
  for (let drift = -maxDrift; drift <= maxDrift; drift++)
    for (let startBin = 0; startBin < bins; startBin++) {
      const indices = input.on.map((_, frame) => startBin + drift * frame);
      if (indices.some((bin) => bin < 0 || bin >= bins)) continue;
      const onPower =
        indices.reduce((sum, bin, frame) => sum + input.on[frame][bin], 0) / indices.length;
      const offPower =
        indices.reduce((sum, bin, frame) => sum + input.off[frame][bin], 0) / indices.length;
      if (onPower < threshold) continue;
      const classification = offPower >= onPower * 0.5 ? 'interference' : 'synthetic-candidate';
      detections.push({
        startBin,
        driftBinsPerFrame: drift,
        onPower,
        offPower,
        classification,
        label: say(classification, locale),
      });
    }
  detections.sort(
    (a, b) =>
      b.onPower - a.onPower || a.startBin - b.startBin || a.driftBinsPerFrame - b.driftBinsPerFrame,
  );
  return {
    locale,
    notice: say('signalsNotice', locale),
    seed: input.seed ?? null,
    detections,
    candidates: detections.filter((item) => item.classification === 'synthetic-candidate').length,
    inputSha256: fingerprint(input),
    traceSha256: fingerprint(detections.map(({ label, ...item }) => item)),
  };
}
