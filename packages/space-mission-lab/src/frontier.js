import { fingerprint } from '@gbesse/branch-lab';
import { runMission } from './mission.js';
import { requireInput } from './frontier-checks.js';
import { frontierConfig } from './frontier-config.js';
import { lightCone } from './lightcone.js';
import { simulateRelay, exportIonContacts } from './relay.js';
import { reconcileCredits } from './credits.js';
import { syntheticSignals, searchSignals } from './signals.js';

export function runFrontier(mission, options = {}) {
  const config = frontierConfig(options),
    locale = config.locale;
  const missionReport = runMission(mission, { locale }),
    light = lightCone({ destination: config.destination }, { locale }),
    delay = light.oneWaySeconds;
  const bundles = missionReport.replay.events
    .filter((event) => event.type === 'observe' && event.status === 'completed')
    .map((event) => {
      const task = mission.tasks.find((task) => task.id === event.taskId),
        createdAt = event.slot * mission.slotMinutes * 60;
      return {
        id: task.id,
        from: 'colony',
        to: 'earth',
        createdAt,
        expiresAt: createdAt + delay + 10000,
        bytes: Math.max(1, Math.round(task.dataMb * 1e6)),
        priority: task.priority,
      };
    });
  const networkInput = {
    schemaVersion: 1,
    nodes: ['colony', 'relay', 'earth'],
    contacts: [
      {
        id: 'uplink-early',
        from: 'colony',
        to: 'relay',
        start: 0,
        end: 900,
        rateBytesPerSec: 1000000,
        latencySec: delay * 0.1,
        costUnits: 10,
      },
      {
        id: 'uplink-late',
        from: 'colony',
        to: 'relay',
        start: 2300,
        end: 5000,
        rateBytesPerSec: 1000000,
        latencySec: delay * 0.1,
        costUnits: 10,
      },
      {
        id: 'relay-earth',
        from: 'relay',
        to: 'earth',
        start: delay * 0.1 + 1000,
        end: delay * 0.1 + 8000,
        rateBytesPerSec: 1000000,
        latencySec: delay * 0.9,
        costUnits: 10,
      },
      {
        id: 'direct',
        from: 'colony',
        to: 'earth',
        start: 2500,
        end: 5000,
        rateBytesPerSec: 1000000,
        latencySec: delay,
        costUnits: 30,
      },
    ],
    bundles,
  };
  const disabledContacts = config.outage ? ['direct'] : [];
  const network = simulateRelay(networkInput, {
    locale,
    policy: config.relayPolicy,
    disabledContacts,
  });
  const comparison = simulateRelay(networkInput, {
    locale,
    policy: config.relayPolicy === 'store-forward' ? 'immediate-direct' : 'store-forward',
    disabledContacts,
  });
  const receipts = network.bundles
    .filter((bundle) => bundle.status === 'delivered')
    .map((bundle, index) => ({
      id: `receipt-${index + 1}`,
      grantId: 'colony-budget',
      branchId: 'wallet-main',
      sequence: index + 1,
      payee: 'relay-provider',
      amountUnits: bundle.costUnits,
      proofId: bundle.id,
      proofSha256: bundle.proofSha256,
      reconcileAt: bundle.deliveredAt + delay,
    }));
  if (config.doubleSpend && receipts.length)
    receipts.push({
      ...receipts[0],
      id: 'receipt-fork',
      branchId: 'wallet-fork',
      payee: 'mirror-provider',
      amountUnits: receipts[0].amountUnits + 1,
    });
  const economyInput = {
    schemaVersion: 1,
    accounts: [
      { id: 'earth-treasury', balanceUnits: 1000 },
      { id: 'relay-provider', balanceUnits: 0 },
      { id: 'mirror-provider', balanceUnits: 0 },
    ],
    grants: [{ id: 'colony-budget', origin: 'earth-treasury', budgetUnits: 300 }],
    proofs: network.bundles,
    receipts,
  };
  const settleAt = Math.max(0, ...receipts.map((receipt) => receipt.reconcileAt));
  const economy = {
    before: reconcileCredits(economyInput, { locale, nowSec: 0 }),
    after: reconcileCredits(economyInput, { locale, nowSec: settleAt }),
    settleAt,
  };
  const spectrogram = syntheticSignals(config.seed, config.signalInjection),
    signals = searchSignals(spectrogram, { locale });
  return {
    schemaVersion: 1,
    locale,
    config,
    missionTraceSha256: missionReport.replay.traceSha256,
    missionObjectives: missionReport.replay.completed.length,
    light,
    network,
    comparison,
    economy,
    signals,
    spectrogram,
    ion: exportIonContacts(networkInput, { locale, disabledContacts }),
    passportSha256: fingerprint({
      config,
      mission: missionReport.replay.traceSha256,
      network: network.traceSha256,
      economy: economy.after.traceSha256,
      signals: signals.traceSha256,
    }),
  };
}
export function dailyFrontier(day) {
  const timestamp = typeof day === 'string' ? Date.parse(day + 'T00:00:00Z') : NaN;
  requireInput(
    typeof day === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(day) &&
      Number.isFinite(timestamp) &&
      new Date(timestamp).toISOString().slice(0, 10) === day,
  );
  const seed = parseInt(fingerprint(day).slice(0, 8), 16);
  return {
    day,
    config: frontierConfig({
      seed,
      destination: ['moon', 'mars', 'proxima'][seed % 3],
      outage: !!(seed & 1),
      doubleSpend: !!(seed & 2),
      signalInjection: !!(seed & 4),
    }),
  };
}
