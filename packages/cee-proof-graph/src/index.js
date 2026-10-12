import { createHash } from 'node:crypto';

const locales = ['fr', 'en', 'es'];
const copy = {
  invalid: ['Données invalides.', 'Invalid data.', 'Datos no válidos.'],
  notice: [
    'Moteur de cohérence sur règles et pièces fournies, sans vérification des fichiers, du chantier ou de l’éligibilité CEE. Les règles de démonstration sont synthétiques.',
    'Consistency engine for supplied rules and evidence, without validating files, works or CEE eligibility. Demo rules are synthetic.',
    'Motor de coherencia para reglas y pruebas aportadas, sin validar archivos, obras ni elegibilidad CEE. Las reglas de demostración son sintéticas.',
  ],
  summary: [
    '{operations} opération(s), {issues} point(s) à examiner.',
    '{operations} operation(s), {issues} issue(s) to review.',
    '{operations} operación(es), {issues} punto(s) por revisar.',
  ],
  RULE_MISSING: [
    'Aucune version de règle applicable à la date d’engagement.',
    'No rule version applies on engagement date.',
    'No hay una versión de regla aplicable en la fecha de compromiso.',
  ],
  RULE_CONFLICT: [
    'Plusieurs versions de règle applicables.',
    'Multiple rule versions apply.',
    'Se aplican varias versiones de la regla.',
  ],
  RGE_MISSING: [
    'Qualification déclarée absente à la date requise.',
    'Declared qualification missing at the required date.',
    'Falta la cualificación declarada en la fecha requerida.',
  ],
  EVIDENCE_MISSING: [
    'Pièce requise absente.',
    'Required evidence missing.',
    'Falta una prueba requerida.',
  ],
  EVIDENCE_UNKNOWN: [
    'Référence de pièce inconnue.',
    'Unknown evidence reference.',
    'Referencia de prueba desconocida.',
  ],
  EVIDENCE_TIMING: [
    'Chronologie de pièce incohérente avec la règle fournie.',
    'Evidence chronology conflicts with supplied rule.',
    'La cronología de la prueba contradice la regla aportada.',
  ],
  EVIDENCE_REUSED: [
    'Empreinte de pièce réutilisée entre opérations : examen requis.',
    'Evidence digest reused across operations: review needed.',
    'Huella de prueba reutilizada entre operaciones: se requiere revisión.',
  ],
};
const say = (key, locale, values = {}) => {
  const index = locales.indexOf(locale);
  if (index < 0) throw Error('Locale / Langue / Idioma: fr, en, es');
  return copy[key][index].replace(/\{(\w+)\}/g, (_, name) => values[name]);
};
const obj = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const str = (value) => typeof value === 'string' && value.trim() !== '';
const day = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  new Date(value).toISOString().slice(0, 10) === value;
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const unique = (rows) => new Set(rows.map((row) => row.id)).size === rows.length;

export function auditCeeProof(input, { locale = 'fr' } = {}) {
  say('invalid', locale);
  try {
    if (
      !obj(input) ||
      !Array.isArray(input.operations) ||
      !Array.isArray(input.rules) ||
      !Array.isArray(input.evidence) ||
      !Array.isArray(input.qualifications) ||
      !unique(input.operations) ||
      !unique(input.evidence)
    )
      throw Error('invalid');
    for (const rule of input.rules)
      if (
        !obj(rule) ||
        !str(rule.code) ||
        !day(rule.validFrom) ||
        !(rule.validTo === null || day(rule.validTo)) ||
        (rule.validTo !== null && rule.validTo < rule.validFrom) ||
        !Array.isArray(rule.requiredTypes) ||
        !rule.requiredTypes.every(str) ||
        new Set(rule.requiredTypes).size !== rule.requiredTypes.length ||
        !Array.isArray(rule.uniqueTypes) ||
        !rule.uniqueTypes.every(str) ||
        new Set(rule.uniqueTypes).size !== rule.uniqueTypes.length ||
        !obj(rule.timing) ||
        !Object.values(rule.timing).every((value) =>
          ['before_engagement', 'after_completion'].includes(value),
        ) ||
        !(rule.rgeDomain === null || str(rule.rgeDomain)) ||
        !['engagement', 'completion'].includes(rule.qualificationAt)
      )
        throw Error('invalid');
    for (const proof of input.evidence)
      if (
        !obj(proof) ||
        !str(proof.id) ||
        !str(proof.type) ||
        !day(proof.issuedAt) ||
        !/^[a-f0-9]{64}$/i.test(proof.sha256) ||
        !str(proof.sourceRef)
      )
        throw Error('invalid');
    for (const item of input.qualifications)
      if (
        !obj(item) ||
        !/^\d{14}$/.test(item.siret) ||
        !str(item.domain) ||
        !day(item.from) ||
        !(item.to === null || day(item.to)) ||
        (item.to !== null && item.to < item.from) ||
        !str(item.source)
      )
        throw Error('invalid');
    const proofs = new Map(input.evidence.map((item) => [item.id, item]));
    const hashOwners = new Map();
    const findings = [];
    const add = (code, ref) => findings.push({ code, message: say(code, locale), ref });
    const operations = input.operations.map((operation, index) => {
      if (
        !obj(operation) ||
        !str(operation.id) ||
        !str(operation.code) ||
        !day(operation.engagedAt) ||
        !day(operation.completedAt) ||
        operation.completedAt < operation.engagedAt ||
        !/^\d{14}$/.test(operation.contractorSiret) ||
        !Array.isArray(operation.evidenceIds) ||
        !operation.evidenceIds.every(str) ||
        new Set(operation.evidenceIds).size !== operation.evidenceIds.length
      )
        throw Error('invalid');
      const ref = `operations.${index}`;
      const applicable = input.rules.filter(
        (rule) =>
          rule.code === operation.code &&
          rule.validFrom <= operation.engagedAt &&
          (rule.validTo === null || operation.engagedAt <= rule.validTo),
      );
      if (applicable.length !== 1) add(applicable.length ? 'RULE_CONFLICT' : 'RULE_MISSING', ref);
      const rule = applicable.length === 1 ? applicable[0] : null;
      const attached = operation.evidenceIds
        .map((id) => {
          if (!proofs.has(id)) add('EVIDENCE_UNKNOWN', ref);
          return proofs.get(id);
        })
        .filter(Boolean);
      if (rule) {
        const qualificationDate =
          rule.qualificationAt === 'engagement' ? operation.engagedAt : operation.completedAt;
        if (
          rule.rgeDomain !== null &&
          !input.qualifications.some(
            (item) =>
              item.siret === operation.contractorSiret &&
              item.domain === rule.rgeDomain &&
              item.from <= qualificationDate &&
              (item.to === null || qualificationDate <= item.to),
          )
        )
          add('RGE_MISSING', ref);
        for (const type of rule.requiredTypes)
          if (!attached.some((item) => item.type === type))
            add('EVIDENCE_MISSING', `${ref}.${type}`);
        for (const proof of attached) {
          const timing = rule.timing[proof.type];
          if (
            (timing === 'before_engagement' && proof.issuedAt > operation.engagedAt) ||
            (timing === 'after_completion' && proof.issuedAt < operation.completedAt)
          )
            add('EVIDENCE_TIMING', ref);
          if (rule.uniqueTypes.includes(proof.type)) {
            const key = `${proof.type}:${proof.sha256}`;
            const owner = hashOwners.get(key);
            if (owner !== undefined && owner !== index) add('EVIDENCE_REUSED', ref);
            else hashOwners.set(key, index);
          }
        }
      }
      return {
        ref,
        code: operation.code,
        ruleVersion: rule ? rule.validFrom : null,
        attachedEvidence: attached.length,
      };
    });
    return {
      schemaVersion: 1,
      locale,
      notice: say('notice', locale),
      summary: say('summary', locale, { operations: operations.length, issues: findings.length }),
      inputSha256: hash(input),
      operations,
      findings,
    };
  } catch {
    throw Error(say('invalid', locale));
  }
}
