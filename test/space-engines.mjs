import assert from 'node:assert/strict';
import {
  runCommons,
  verifyMarketReceipt,
} from '../packages/space-mission-lab/src/commons-engine.js';
const benchmark = await runCommons('benchmark', { profile: 'iss', stepSec: 30 });
assert.ok(benchmark.result.maxEngineDifferenceM > 0 && benchmark.result.maxEngineDifferenceM < 10);
assert.ok(benchmark.result.maxReferenceResidualM > 100000);
assert.ok(benchmark.result.relativeEnergyDrift < 1e-6);
assert.deepEqual(
  benchmark.result.engines.slice(0, 2).map((x) => x.name),
  ['Basilisk', 'Orekit'],
);
const coarse = await runCommons('benchmark', { profile: 'iss', stepSec: 120 });
assert.ok(coarse.result.maxEngineDifferenceM > benchmark.result.maxEngineDifferenceM * 100);
assert.equal(coarse.result.passed, false);
const moon = await runCommons('benchmark', { profile: 'moon', stepSec: 60 });
assert.equal(moon.result.samples.length, 721);
assert.equal(moon.result.sources[0].id, 'de440s');
const market = await runCommons('market', { budgetUnits: 100, seed: 42, outage: 'none' });
assert.equal(market.result.invariantsPassed, true);
assert.equal(market.result.solverStatus, 'OPTIMAL');
assert.ok(market.result.scienceValue >= market.result.baseline.scienceValue);
assert.ok(market.result.spentUnits <= 100);
assert.equal(market.result.transportProof.nodes, 2);
assert.equal(market.result.transportProof.protocol, 'BPv7 / UDP');
assert.equal(market.result.transportProof.sentSha256, market.result.transportProof.receivedSha256);
assert.equal(verifyMarketReceipt(market.result.receipt), true);
assert.equal(
  market.result.receipt.payload.settledUnits + market.result.receipt.payload.returnedUnits,
  100,
);
const outage = await runCommons('market', { outage: 'tenerife', budgetUnits: 50, seed: 42 });
assert.ok(outage.result.awards.every((a) => a.station !== 'tenerife'));
assert.ok(outage.result.spentUnits <= 50);
const citizen = await runCommons('citizen', { snr: 25, maxDriftHzSec: 4 });
assert.equal(citizen.result.carrierHits, 1);
assert.ok(Math.abs(citizen.result.measuredPeakDriftHzSec + 0.3741) < 0.005);
assert.equal(citizen.result.observedShape[0], 16);
assert.equal(citizen.result.offObservationAvailable, false);
assert.equal(citizen.result.classification, 'known-human-spacecraft');
assert.ok(citizen.result.hits.length >= 3);
console.log(
  'FR : 6 calculs réels validés. EN: 6 real computations validated. ES: 6 cálculos reales validados.',
);
console.log(
  JSON.stringify({
    benchmarkDifferenceM: benchmark.result.maxEngineDifferenceM,
    coarseDifferenceM: coarse.result.maxEngineDifferenceM,
    scienceValue: market.result.scienceValue,
    baselineValue: market.result.baseline.scienceValue,
    voyagerDriftHzSec: citizen.result.measuredPeakDriftHzSec,
  }),
);
