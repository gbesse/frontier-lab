import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const languages = ['fr', 'en', 'es'];
export const requiredScenarios = Object.freeze([
  'valid',
  'valid_second_session',
  'tampered',
  'expired',
  'wrong_nonce',
  'wrong_audience',
  'untrusted_issuer',
  'missing_age_claim',
  'replay_presentation',
]);
const formats = ['mdoc', 'zkp'];
const copy = {
  invalid: ['Données de test invalides.', 'Invalid test data.', 'Datos de prueba no válidos.'],
  notice: [
    'Banc d’essai sur observations et canaris synthétiques : aucune validation cryptographique ni certification de conformité. Ne chargez pas de preuves réelles.',
    'Observation and synthetic-canary test lab: no cryptographic validation or compliance certification. Do not load real proofs.',
    'Laboratorio de observaciones y canarios sintéticos: no valida criptografía ni certifica conformidad. No cargues pruebas reales.',
  ],
  summary: [
    '{findings} anomalie(s), {missing} test(s) manquant(s) ; {status}.',
    '{findings} finding(s), {missing} missing test(s); {status}.',
    '{findings} hallazgo(s), {missing} prueba(s) faltante(s); {status}.',
  ],
  review_ready: ['prêt pour revue humaine', 'ready for human review', 'listo para revisión humana'],
  issues_found: ['anomalies à examiner', 'findings to investigate', 'hallazgos por investigar'],
  inconclusive: ['couverture insuffisante', 'insufficient coverage', 'cobertura insuficiente'],
  MISSING_TEST: [
    'Scénario de test absent.',
    'Test scenario missing.',
    'Falta un escenario de prueba.',
  ],
  MISSING_FORMAT: [
    'Format de preuve obligatoire absent.',
    'Required proof format missing.',
    'Falta un formato de prueba obligatorio.',
  ],
  MISSING_LINKABILITY_EVIDENCE: [
    'Comparaison de deux présentations indépendantes indisponible.',
    'Two independent presentations cannot be compared.',
    'No se pueden comparar dos presentaciones independientes.',
  ],
  CANARY_NOT_EXERCISED: [
    'Canari absent des requêtes capturées : absence de fuite non concluante.',
    'Canary absent from captured requests: no-leak result is inconclusive.',
    'Canario ausente de las solicitudes capturadas: la ausencia de fuga no es concluyente.',
  ],
  INVALID_ACCEPTED: [
    'Présentation invalide acceptée.',
    'Invalid presentation accepted.',
    'Se aceptó una presentación inválida.',
  ],
  VALID_REJECTED: [
    'Présentation valide de test refusée.',
    'Valid test presentation rejected.',
    'Se rechazó una presentación válida de prueba.',
  ],
  UNVERIFIED_ALLOW: [
    'Accès accordé sans preuve déclarée de tous les contrôles.',
    'Access granted without recorded evidence for every check.',
    'Se concedió acceso sin evidencia registrada de todos los controles.',
  ],
  EXCESSIVE_DISCLOSURE: [
    'Attribut divulgué au-delà du minimum déclaré.',
    'Attribute disclosed beyond the declared minimum.',
    'Se reveló un atributo fuera del mínimo declarado.',
  ],
  LINKABLE_PRESENTATION: [
    'Identifiant de présentation stable entre deux essais.',
    'Stable presentation identifier across two tests.',
    'Identificador de presentación estable entre dos pruebas.',
  ],
  THIRD_PARTY_CANARY: [
    'Canari transmis à un domaine tiers.',
    'Canary sent to a third-party origin.',
    'Canario enviado a un origen de terceros.',
  ],
};
const msg = (key, locale, vars = {}) => {
  const n = languages.indexOf(locale);
  if (n < 0) throw Error('Locale / Langue / Idioma: fr, en, es');
  return copy[key][n].replace(/\{(\w+)\}/g, (_, name) => vars[name]);
};
const object = (v) => v && typeof v === 'object' && !Array.isArray(v);
const string = (v) => typeof v === 'string' && v.trim() !== '';
const sha = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const normalizedOrigin = (value) => {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
    throw Error('origin');
  return url.origin;
};
const result = (input, findings, missing, locale) => {
  const status = missing ? 'inconclusive' : findings.length ? 'issues_found' : 'review_ready';
  return {
    schemaVersion: 1,
    locale,
    status,
    notice: msg('notice', locale),
    summary: msg('summary', locale, {
      findings: findings.length,
      missing,
      status: msg(status, locale),
    }),
    inputSha256: sha(input),
    findings,
  };
};

export function assessAgeProof(input, { locale = 'fr' } = {}) {
  msg('invalid', locale);
  try {
    if (
      !object(input) ||
      !string(input.rpOrigin) ||
      !Array.isArray(input.formats) ||
      input.formats.length === 0 ||
      !input.formats.every((v) => formats.includes(v)) ||
      new Set(input.formats).size !== input.formats.length ||
      !Array.isArray(input.attempts)
    )
      throw Error('invalid');
    normalizedOrigin(input.rpOrigin);
    const ids = new Set();
    const seen = new Set();
    const findings = [];
    const add = (code, ref) => findings.push({ code, message: msg(code, locale), ref });
    const tagOwner = new Map();
    for (const attempt of input.attempts) {
      if (
        !object(attempt) ||
        !string(attempt.id) ||
        ids.has(attempt.id) ||
        !input.formats.includes(attempt.format) ||
        !requiredScenarios.includes(attempt.scenario) ||
        !['allow', 'deny'].includes(attempt.decision) ||
        !string(attempt.evidenceRef) ||
        !Array.isArray(attempt.disclosedClaims) ||
        !attempt.disclosedClaims.every(string)
      )
        throw Error('invalid');
      ids.add(attempt.id);
      if (seen.has(`${attempt.format}:${attempt.scenario}`)) throw Error('invalid');
      seen.add(`${attempt.format}:${attempt.scenario}`);
      const shouldAllow = ['valid', 'valid_second_session'].includes(attempt.scenario);
      if (shouldAllow && attempt.decision !== 'allow') add('VALID_REJECTED', attempt.id);
      if (!shouldAllow && attempt.decision !== 'deny') add('INVALID_ACCEPTED', attempt.id);
      if (attempt.decision === 'allow') {
        const checks = attempt.checks;
        if (
          !object(checks) ||
          !['signature', 'issuerTrusted', 'nonce', 'audience', 'validity', 'ageClaim'].every(
            (key) => checks[key] === true,
          )
        )
          add('UNVERIFIED_ALLOW', attempt.id);
      }
      if (attempt.disclosedClaims.some((name) => name !== 'age_over_18'))
        add('EXCESSIVE_DISCLOSURE', attempt.id);
      if (shouldAllow && attempt.decision === 'allow' && string(attempt.presentationTag)) {
        if (tagOwner.has(attempt.presentationTag)) add('LINKABLE_PRESENTATION', attempt.id);
        else tagOwner.set(attempt.presentationTag, attempt.id);
      }
    }
    let missing = 0;
    for (const format of formats)
      if (!input.formats.includes(format)) {
        add('MISSING_FORMAT', format);
        missing++;
      }
    for (const format of input.formats)
      for (const scenario of requiredScenarios) {
        if (!seen.has(`${format}:${scenario}`)) {
          add('MISSING_TEST', `${format}:${scenario}`);
          missing++;
        }
      }
    for (const format of input.formats) {
      const pair = input.attempts.filter(
        (attempt) =>
          attempt.format === format && ['valid', 'valid_second_session'].includes(attempt.scenario),
      );
      if (pair.length === 2 && !pair.every((attempt) => string(attempt.presentationTag))) {
        add('MISSING_LINKABILITY_EVIDENCE', format);
        missing++;
      }
    }
    return {
      ...result(input, findings, missing, locale),
      formatCoverage: formats.map((format) => ({
        format,
        observed: requiredScenarios.filter((scenario) => seen.has(`${format}:${scenario}`)),
        required: requiredScenarios,
      })),
    };
  } catch {
    throw Error(msg('invalid', locale));
  }
}

export async function runAgeProofContract(
  cases,
  adapter,
  { rpOrigin, formats: requiredFormats = formats, locale = 'fr' } = {},
) {
  msg('invalid', locale);
  if (!Array.isArray(cases) || typeof adapter !== 'function') throw Error(msg('invalid', locale));
  const attempts = [];
  for (const testCase of cases) {
    if (
      !object(testCase) ||
      !string(testCase.id) ||
      !requiredScenarios.includes(testCase.scenario) ||
      !formats.includes(testCase.format)
    )
      throw Error(msg('invalid', locale));
    const observed = await adapter(testCase);
    if (!object(observed)) throw Error(msg('invalid', locale));
    attempts.push({
      id: testCase.id,
      format: testCase.format,
      scenario: testCase.scenario,
      evidenceRef: observed.evidenceRef ?? `adapter:${testCase.id}`,
      decision: observed.decision,
      checks: observed.checks,
      disclosedClaims: observed.disclosedClaims ?? [],
      presentationTag: observed.presentationTag,
    });
  }
  return assessAgeProof({ rpOrigin, formats: requiredFormats, attempts }, { locale });
}

const sensitiveForms = (canary) => [
  canary,
  encodeURIComponent(canary),
  Buffer.from(canary).toString('base64'),
];
export function scanHarForCanaries(har, { rpOrigin, canaries, locale = 'fr' } = {}) {
  msg('invalid', locale);
  try {
    if (
      !object(har) ||
      !object(har.log) ||
      !Array.isArray(har.log.entries) ||
      !Array.isArray(canaries) ||
      canaries.length === 0 ||
      !canaries.every((v) => string(v) && v.length >= 12) ||
      !string(rpOrigin)
    )
      throw Error('invalid');
    const firstParty = normalizedOrigin(rpOrigin);
    const findings = [];
    const destinations = new Set();
    const exercised = new Set();
    for (const [index, entry] of har.log.entries.entries()) {
      if (!object(entry) || !object(entry.request) || !string(entry.request.url))
        throw Error('invalid');
      const destination = normalizedOrigin(entry.request.url);
      const request = entry.request;
      const haystack = [
        request.url,
        request.postData?.text ?? '',
        ...(Array.isArray(request.headers)
          ? request.headers.map((h) => `${h.name ?? ''}:${h.value ?? ''}`)
          : []),
      ].join('\n');
      const hits = canaries.filter((canary) =>
        sensitiveForms(canary).some((form) => haystack.includes(form)),
      );
      for (const canary of hits) exercised.add(canary);
      if (destination !== firstParty && hits.length) {
        findings.push({
          code: 'THIRD_PARTY_CANARY',
          message: msg('THIRD_PARTY_CANARY', locale),
          ref: `har.entry.${index}`,
          destinationOrigin: destination,
        });
        destinations.add(destination);
      }
    }
    const missing = canaries.filter((canary) => !exercised.has(canary)).length;
    if (missing)
      findings.push({
        code: 'CANARY_NOT_EXERCISED',
        message: msg('CANARY_NOT_EXERCISED', locale),
        ref: 'har.requests',
      });
    return {
      ...result(
        { rpOrigin: firstParty, entryCount: har.log.entries.length },
        findings,
        missing,
        locale,
      ),
      captureSha256: sha(har),
      inspectedRequests: har.log.entries.length,
      thirdPartyOriginsWithCanary: [...destinations].sort(),
    };
  } catch {
    throw Error(msg('invalid', locale));
  }
}

export async function captureAgeProofEgress({ url, canaries, run, locale = 'fr', browser } = {}) {
  msg('invalid', locale);
  if (!string(url) || !Array.isArray(canaries) || typeof run !== 'function')
    throw Error(msg('invalid', locale));
  let ownedBrowser;
  let context;
  const temp = await mkdtemp(join(tmpdir(), 'age-proof-egress-'));
  const path = join(temp, 'capture.har');
  try {
    const rpOrigin = normalizedOrigin(url);
    const instance =
      browser ??
      (ownedBrowser = await (await import('playwright')).chromium.launch({ headless: true }));
    context = await instance.newContext({ recordHar: { path, content: 'omit' } });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await run(page);
    await context.close();
    context = undefined;
    const har = JSON.parse(await readFile(path, 'utf8'));
    return scanHarForCanaries(har, { rpOrigin, canaries, locale });
  } catch {
    throw Error(msg('invalid', locale));
  } finally {
    if (context) await context.close();
    if (ownedBrowser) await ownedBrowser.close();
    await rm(temp, { recursive: true, force: true });
  }
}
