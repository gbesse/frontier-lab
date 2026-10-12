import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { replayBill } from '../packages/bill-replay/src/index.js';
import { auditWarrantyJourney } from '../packages/garan-witness/src/index.js';
import {
  assessAgeProof,
  runAgeProofContract,
  scanHarForCanaries,
  requiredScenarios,
} from '../packages/age-proof-lab/src/index.js';

const fixture = async (name, file = 'sample.json') =>
  JSON.parse(await readFile(resolve('packages', name, 'fixtures', file), 'utf8'));

test('bill replay uses exact decimal math and fails closed on missing or overlapping rates in FR/EN/ES', async () => {
  const input = await fixture('bill-replay');
  for (const locale of ['fr', 'en', 'es']) {
    const report = replayBill(input, { locale });
    assert.equal(report.energy.expectedCents, '55');
    assert.equal(report.energy.billedCents, '56');
    assert.equal(report.findings[0].code, 'ENERGY_MISMATCH');
    assert.ok(report.summary.length > 10 && report.notice.length > 50);
  }
  const gap = structuredClone(input);
  gap.tariffs.pop();
  assert.equal(replayBill(gap).energy.expectedCents, null);
  assert.ok(replayBill(gap).findings.some((item) => item.code === 'RATE_GAP'));
  const overlap = structuredClone(input);
  overlap.tariffs[1].from = overlap.tariffs[0].from;
  assert.ok(replayBill(overlap).findings.some((item) => item.code === 'RATE_OVERLAP'));
  const duplicate = structuredClone(input);
  duplicate.meter.push({ ...duplicate.meter[0] });
  assert.ok(replayBill(duplicate).findings.some((item) => item.code === 'METER_DUPLICATE'));
  const empty = structuredClone(input);
  empty.meter = [];
  assert.ok(replayBill(empty).findings.some((item) => item.code === 'METER_MISSING'));
});

test('warranty journey distinguishes missing notice, unexpected GARAN and locale drift in three languages', async () => {
  const input = await fixture('garan-witness');
  for (const locale of ['fr', 'en', 'es']) {
    const report = auditWarrantyJourney(input, { locale });
    assert.equal(report.pages.length, 2);
    assert.deepEqual(
      report.pages[1].findings.map((f) => f.code),
      ['LOCALE_MISMATCH', 'NOTICE_MISSING'],
    );
    assert.ok(report.notice.length > 30);
  }
  const changed = structuredClone(input);
  changed.pages[0].observation.garanVisible = false;
  assert.ok(
    auditWarrantyJourney(changed).pages[0].findings.some((f) => f.code === 'GARAN_MISSING'),
  );
  changed.pages[0].observation.garanVisible = true;
  changed.pages[1].observation.garanVisible = true;
  assert.ok(
    auditWarrantyJourney(changed).pages[1].findings.some((f) => f.code === 'GARAN_UNEXPECTED'),
  );
});

test('age proof negative matrix covers mdoc and ZKP, with no false ban on credential reuse', async () => {
  const input = await fixture('age-proof-lab');
  for (const locale of ['fr', 'en', 'es']) {
    const report = assessAgeProof(input, { locale });
    assert.equal(report.status, 'review_ready');
    assert.equal(report.findings.length, 0);
    assert.deepEqual(
      report.formatCoverage.map((item) => item.observed.length),
      [requiredScenarios.length, requiredScenarios.length],
    );
    assert.equal(JSON.stringify(report).includes('synthetic-z-1'), false);
  }
  const broken = structuredClone(input);
  broken.attempts.find(
    (item) => item.scenario === 'replay_presentation' && item.format === 'zkp',
  ).decision = 'allow';
  broken.attempts
    .find((item) => item.scenario === 'valid' && item.format === 'mdoc')
    .disclosedClaims.push('birth_date');
  let report = assessAgeProof(broken);
  assert.ok(report.findings.some((f) => f.code === 'INVALID_ACCEPTED'));
  assert.ok(report.findings.some((f) => f.code === 'EXCESSIVE_DISCLOSURE'));
  const linkable = structuredClone(input);
  linkable.attempts.find(
    (item) => item.scenario === 'valid_second_session' && item.format === 'zkp',
  ).presentationTag = 'synthetic-z-1';
  assert.ok(assessAgeProof(linkable).findings.some((f) => f.code === 'LINKABLE_PRESENTATION'));
  for (const scenario of requiredScenarios.filter(
    (value) => !['valid', 'valid_second_session'].includes(value),
  )) {
    const vulnerable = structuredClone(input);
    const attempt = vulnerable.attempts.find(
      (item) => item.scenario === scenario && item.format === 'mdoc',
    );
    attempt.decision = 'allow';
    assert.ok(
      assessAgeProof(vulnerable).findings.some(
        (f) => f.code === 'INVALID_ACCEPTED' && f.ref === attempt.id,
      ),
    );
  }
  const falseReject = structuredClone(input);
  falseReject.attempts.find(
    (item) => item.scenario === 'valid' && item.format === 'mdoc',
  ).decision = 'deny';
  assert.ok(assessAgeProof(falseReject).findings.some((f) => f.code === 'VALID_REJECTED'));
  const unverified = structuredClone(input);
  unverified.attempts.find(
    (item) => item.scenario === 'valid' && item.format === 'zkp',
  ).checks.issuerTrusted = false;
  assert.ok(assessAgeProof(unverified).findings.some((f) => f.code === 'UNVERIFIED_ALLOW'));
  const oneFormat = structuredClone(input);
  oneFormat.formats = ['mdoc'];
  oneFormat.attempts = oneFormat.attempts.filter((item) => item.format === 'mdoc');
  assert.equal(assessAgeProof(oneFormat).status, 'inconclusive');
  assert.ok(assessAgeProof(oneFormat).findings.some((f) => f.code === 'MISSING_FORMAT'));
  broken.attempts.pop();
  report = assessAgeProof(broken);
  assert.equal(report.status, 'inconclusive');
  assert.ok(report.findings.some((f) => f.code === 'MISSING_TEST'));
});

test('age proof active adapter contract and HAR canary scan redact raw data', async () => {
  const input = await fixture('age-proof-lab');
  const report = await runAgeProofContract(
    input.attempts,
    async (testCase) => ({
      decision: testCase.decision,
      checks: testCase.checks,
      disclosedClaims: testCase.disclosedClaims,
      evidenceRef: testCase.evidenceRef,
      presentationTag: testCase.presentationTag,
    }),
    { rpOrigin: input.rpOrigin, formats: input.formats, locale: 'es' },
  );
  assert.equal(report.status, 'review_ready');
  const har = await fixture('age-proof-lab', 'leak.har.json');
  const policy = await fixture('age-proof-lab', 'policy.json');
  for (const locale of ['fr', 'en', 'es']) {
    const leakage = scanHarForCanaries(har, { ...policy, locale });
    assert.equal(leakage.findings.length, 1);
    assert.equal(leakage.findings[0].destinationOrigin, 'https://analytics.example.test');
    assert.equal(JSON.stringify(leakage).includes(policy.canaries[0]), false);
  }
  const encoded = structuredClone(har);
  encoded.log.entries[1].request.url = 'https://analytics.example.test/collect';
  encoded.log.entries[1].request.postData = {
    text: Buffer.from(policy.canaries[0]).toString('base64'),
  };
  assert.equal(scanHarForCanaries(encoded, policy).findings.length, 1);
  const notExercised = structuredClone(har);
  notExercised.log.entries = [];
  assert.equal(scanHarForCanaries(notExercised, policy).status, 'inconclusive');
  assert.ok(
    scanHarForCanaries(notExercised, policy).findings.some(
      (f) => f.code === 'CANARY_NOT_EXERCISED',
    ),
  );
  const special = structuredClone(har);
  const specialCanary = 'SYNTHETIC@AGE#TOKEN_12345';
  special.log.entries[0].request.postData.text = specialCanary;
  special.log.entries[1].request.url = `https://analytics.example.test/collect?proof=${encodeURIComponent(specialCanary)}`;
  assert.equal(
    scanHarForCanaries(special, { ...policy, canaries: [specialCanary] }).findings[0].code,
    'THIRD_PARTY_CANARY',
  );
});
