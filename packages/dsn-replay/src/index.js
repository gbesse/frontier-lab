import { createHash } from 'node:crypto';

const locales = ['fr', 'en', 'es'];
const copy = {
  invalid: ['Données invalides.', 'Invalid data.', 'Datos no válidos.'],
  notice: [
    'Simulation locale sur montants fournis, sans lecture native des fichiers DSN/CRM ni dépôt auprès de l’Urssaf. Les droits sociaux et corrections doivent être validés par un professionnel.',
    'Local simulation of supplied amounts, without native DSN/CRM parsing or submission to Urssaf. A professional must validate social rights and corrections.',
    'Simulación local de importes aportados, sin leer archivos DSN/CRM de forma nativa ni presentarlos ante Urssaf. Un profesional debe validar los derechos y las correcciones.',
  ],
  summary: [
    '{cases} cas, {issues} anomalie(s) à revoir.',
    '{cases} case(s), {issues} finding(s) to review.',
    '{cases} caso(s), {issues} hallazgo(s) por revisar.',
  ],
  UNRESOLVED: [
    'Écart restant sans correction proposée.',
    'Remaining discrepancy without a proposed correction.',
    'Diferencia pendiente sin corrección propuesta.',
  ],
  PROPOSAL_MISMATCH: [
    'La correction proposée ne rejoint pas la source de paie.',
    'Proposed correction does not reconcile with payroll source.',
    'La corrección propuesta no concilia con la fuente de nómina.',
  ],
  DOUBLE_CORRECTION_RISK: [
    'Base déjà rapprochée : nouvelle correction potentiellement double.',
    'Base already reconciled: another correction may duplicate it.',
    'Base ya conciliada: otra corrección podría duplicarla.',
  ],
  POST_SUBSTITUTION_REEMISSION: [
    'Montant substitué par l’Urssaf proposé à nouveau en DSN.',
    'Urssaf-substituted amount proposed for re-emission in DSN.',
    'Importe sustituido por Urssaf propuesto de nuevo en la DSN.',
  ],
  REUSED_CORRECTION: [
    'Même référence de correction appliquée plusieurs fois.',
    'The same correction reference was applied more than once.',
    'La misma referencia de corrección se aplicó más de una vez.',
  ],
};
const say = (key, locale, values = {}) => {
  const index = locales.indexOf(locale);
  if (index < 0) throw Error('Locale / Langue / Idioma: fr, en, es');
  return copy[key][index].replace(/\{(\w+)\}/g, (_, field) => values[field]);
};
const obj = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const str = (value) => typeof value === 'string' && value.trim() !== '';
const cents = (value) => {
  if (typeof value !== 'string' || !/^-?\d+$/.test(value)) throw Error('invalid');
  return BigInt(value);
};
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function replayDsnCorrections(input, { locale = 'fr' } = {}) {
  say('invalid', locale);
  try {
    if (!obj(input) || !Array.isArray(input.cases)) throw Error('invalid');
    const keys = new Set();
    const findings = [];
    const add = (code, ref) => findings.push({ code, message: say(code, locale), ref });
    const cases = input.cases.map((row, index) => {
      if (
        !obj(row) ||
        !str(row.employeeRef) ||
        !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(row.month) ||
        !['monthly', 'post_substitution'].includes(row.crmKind) ||
        !Array.isArray(row.appliedCorrections) ||
        !str(row.evidenceRef) ||
        !(row.proposedDeltaCents === null || typeof row.proposedDeltaCents === 'string') ||
        !['payroll_review', 'crm_post_substitution', 'none'].includes(row.proposalOrigin)
      )
        throw Error('invalid');
      const key = `${row.employeeRef}:${row.month}`;
      if (keys.has(key)) throw Error('invalid');
      keys.add(key);
      const declared = cents(row.declaredBaseCents);
      const target = cents(row.payrollBaseCents);
      const correctionRefs = new Set();
      let current = declared;
      for (const correction of row.appliedCorrections) {
        if (!obj(correction) || !str(correction.id) || !str(correction.sourceRef))
          throw Error('invalid');
        current += cents(correction.deltaCents);
        if (correctionRefs.has(correction.sourceRef)) add('REUSED_CORRECTION', `cases.${index}`);
        correctionRefs.add(correction.sourceRef);
      }
      const proposed = row.proposedDeltaCents === null ? null : cents(row.proposedDeltaCents);
      if (proposed === null && current !== target) add('UNRESOLVED', `cases.${index}`);
      else if (proposed !== null && current === target && proposed !== 0n)
        add('DOUBLE_CORRECTION_RISK', `cases.${index}`);
      else if (proposed !== null && current + proposed !== target)
        add('PROPOSAL_MISMATCH', `cases.${index}`);
      if (
        row.crmKind === 'post_substitution' &&
        row.proposalOrigin === 'crm_post_substitution' &&
        proposed !== null &&
        proposed !== 0n
      )
        add('POST_SUBSTITUTION_REEMISSION', `cases.${index}`);
      return {
        ref: `cases.${index}`,
        reconciledBeforeProposal: current === target,
        reconciledAfterProposal: proposed !== null && current + proposed === target,
        appliedCount: row.appliedCorrections.length,
      };
    });
    return {
      schemaVersion: 1,
      locale,
      notice: say('notice', locale),
      summary: say('summary', locale, { cases: cases.length, issues: findings.length }),
      inputSha256: hash(input),
      cases,
      findings,
    };
  } catch {
    throw Error(say('invalid', locale));
  }
}
