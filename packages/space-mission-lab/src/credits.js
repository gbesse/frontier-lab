import { fingerprint } from '@gbesse/branch-lab';
import { identifier, number, integer, unique, requireInput } from './frontier-checks.js';
import { say } from './i18n.js';

export function reconcileCredits(input, { locale = 'fr', nowSec = 0 } = {}) {
  say('frontierInvalid', locale);
  requireInput(
    input?.schemaVersion === 1 &&
      number(nowSec) &&
      Array.isArray(input.accounts) &&
      input.accounts.length <= 20 &&
      unique(input.accounts) &&
      input.accounts.every((account) => identifier(account.id) && integer(account.balanceUnits)) &&
      Array.isArray(input.grants) &&
      input.grants.length <= 20 &&
      unique(input.grants) &&
      Array.isArray(input.receipts) &&
      input.receipts.length <= 48 &&
      unique(input.receipts) &&
      Array.isArray(input.proofs) &&
      input.proofs.length <= 24 &&
      unique(input.proofs),
    locale,
  );
  const accounts = new Map(input.accounts.map((account) => [account.id, account.balanceUnits])),
    escrow = new Map();
  for (const grant of input.grants) {
    requireInput(
      identifier(grant.id) &&
        accounts.has(grant.origin) &&
        integer(grant.budgetUnits, 1) &&
        accounts.get(grant.origin) >= grant.budgetUnits,
      locale,
    );
    accounts.set(grant.origin, accounts.get(grant.origin) - grant.budgetUnits);
    escrow.set(grant.id, grant.budgetUnits);
  }
  for (const proof of input.proofs)
    requireInput(
      identifier(proof.id) &&
        ['delivered', 'unreachable'].includes(proof.status) &&
        /^[a-f0-9]{64}$/.test(proof.proofSha256) &&
        (proof.status !== 'delivered' || number(proof.deliveredAt)),
      locale,
    );
  for (const receipt of input.receipts)
    requireInput(
      identifier(receipt.id) &&
        identifier(receipt.branchId) &&
        input.grants.some((grant) => grant.id === receipt.grantId) &&
        integer(receipt.sequence, 1, 48) &&
        accounts.has(receipt.payee) &&
        integer(receipt.amountUnits, 1) &&
        identifier(receipt.proofId) &&
        typeof receipt.proofSha256 === 'string' &&
        number(receipt.reconcileAt),
      locale,
    );
  const localSpent = new Map(),
    seenLocal = new Map(),
    results = [];
  for (const receipt of input.receipts) {
    const grant = input.grants.find((grant) => grant.id === receipt.grantId),
      proof = input.proofs.find((proof) => proof.id === receipt.proofId);
    const localKey = `${receipt.grantId}/${receipt.branchId}`,
      sequenceKey = `${localKey}/${receipt.sequence}`;
    const fingerprintFields = {
      grantId: receipt.grantId,
      sequence: receipt.sequence,
      payee: receipt.payee,
      amountUnits: receipt.amountUnits,
      proofId: receipt.proofId,
      proofSha256: receipt.proofSha256,
    };
    const digest = fingerprint(fingerprintFields),
      prior = seenLocal.get(sequenceKey);
    let localCode = 'tentative';
    if (
      !proof ||
      proof.status !== 'delivered' ||
      proof.proofSha256 !== receipt.proofSha256 ||
      receipt.reconcileAt < proof.deliveredAt
    )
      localCode = 'invalid-proof';
    else if (prior === digest) localCode = 'duplicate';
    else if (prior || (localSpent.get(localKey) ?? 0) + receipt.amountUnits > grant.budgetUnits)
      localCode = 'budget-blocked';
    else {
      seenLocal.set(sequenceKey, digest);
      localSpent.set(localKey, (localSpent.get(localKey) ?? 0) + receipt.amountUnits);
    }
    results.push({
      ...receipt,
      digest,
      localCode,
      status: localCode === 'tentative' ? 'pending' : localCode,
    });
  }
  const allArrived = results.every((receipt) => receipt.reconcileAt <= nowSec);
  const quarantined = new Set(),
    globalSequences = new Map(),
    proofClaims = new Map();
  if (allArrived) {
    for (const receipt of results.filter((receipt) => receipt.localCode === 'tentative')) {
      const key = `${receipt.grantId}/${receipt.sequence}`,
        prior = globalSequences.get(key);
      if (prior && prior.digest !== receipt.digest) {
        quarantined.add(receipt.grantId);
        quarantined.add(prior.grantId);
      } else globalSequences.set(key, receipt);
      const proofPrior = proofClaims.get(receipt.proofId);
      if (proofPrior && proofPrior.digest !== receipt.digest) {
        quarantined.add(receipt.grantId);
        quarantined.add(proofPrior.grantId);
      } else proofClaims.set(receipt.proofId, receipt);
    }
  }
  const settledSequences = new Set(),
    settledProofs = new Set();
  for (const receipt of results) {
    if (receipt.localCode !== 'tentative' || !allArrived) continue;
    const key = `${receipt.grantId}/${receipt.sequence}`;
    if (quarantined.has(receipt.grantId)) receipt.status = 'conflict';
    else if (settledSequences.has(key) || settledProofs.has(receipt.proofId))
      receipt.status = 'duplicate';
    else if (escrow.get(receipt.grantId) < receipt.amountUnits) receipt.status = 'budget-blocked';
    else {
      receipt.status = 'settled';
      escrow.set(receipt.grantId, escrow.get(receipt.grantId) - receipt.amountUnits);
      accounts.set(receipt.payee, accounts.get(receipt.payee) + receipt.amountUnits);
      settledSequences.add(key);
      settledProofs.add(receipt.proofId);
    }
  }
  const initialUnits = input.accounts.reduce((sum, account) => sum + account.balanceUnits, 0);
  const conservedUnits = [...accounts.values(), ...escrow.values()].reduce(
    (sum, value) => sum + value,
    0,
  );
  requireInput(Number.isSafeInteger(initialUnits) && conservedUnits === initialUnits, locale);
  const payments = results.map((receipt) => ({ ...receipt, label: say(receipt.status, locale) }));
  return {
    schemaVersion: 1,
    locale,
    unit: 'SIM-CREDIT',
    notice: say('creditsNotice', locale),
    allArrived,
    nowSec,
    initialUnits,
    conservedUnits,
    settledUnits: payments
      .filter((receipt) => receipt.status === 'settled')
      .reduce((sum, receipt) => sum + receipt.amountUnits, 0),
    escrowUnits: [...escrow.values()].reduce((sum, value) => sum + value, 0),
    quarantinedGrants: [...quarantined],
    accounts: Object.fromEntries(accounts),
    escrow: Object.fromEntries(escrow),
    payments,
    inputSha256: fingerprint(input),
    traceSha256: fingerprint({ nowSec, results, accounts: [...accounts], escrow: [...escrow] }),
  };
}
