import { createHash } from 'node:crypto';
import { readFile, realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';

const locales = ['fr', 'en', 'es'];
const copy = {
  invalid: ['Entrée invalide.', 'Invalid input.', 'Entrada no válida.'],
  summary: [
    '{released} preuve(s) partagée(s), {unresolved} demande(s) non résolue(s).',
    '{released} evidence-backed claim(s) shared; {unresolved} request(s) unresolved.',
    '{released} declaración(es) respaldada(s) compartida(s); {unresolved} solicitud(es) sin resolver.',
  ],
  notice: [
    'Le hash confirme l’intégrité du fichier local, pas la véracité de son contenu ni une conformité réglementaire.',
    'The hash checks local file integrity, not the truth of its contents or regulatory compliance.',
    'El hash comprueba la integridad del archivo local, no la veracidad de su contenido ni el cumplimiento normativo.',
  ],
  missing: [
    'Aucune déclaration pour ce lot.',
    'No claim for this lot.',
    'No hay declaración para este lote.',
  ],
  withheld: [
    'Partage non autorisé pour cet acheteur.',
    'Disclosure not allowed for this buyer.',
    'Divulgación no autorizada para este comprador.',
  ],
  expired: [
    'Déclaration ou preuve expirée.',
    'Claim or evidence expired.',
    'Declaración o prueba caducada.',
  ],
  conflict: [
    'Déclarations contradictoires pour ce lot.',
    'Conflicting claims for this lot.',
    'Declaraciones contradictorias para este lote.',
  ],
  invalidEvidence: [
    'Preuve absente, illisible, non sûre ou de hash différent.',
    'Evidence missing, unreadable, unsafe or hash-mismatched.',
    'Prueba ausente, ilegible, no segura o con hash distinto.',
  ],
};
const message = (key, locale, params = {}) =>
  copy[key][locales.indexOf(locale)].replace(/\{(\w+)\}/g, (_, name) => params[name]);
const object = (value) => value && typeof value === 'object' && !Array.isArray(value);
const validDate = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));

async function evidenceMatches(evidence, baseDir) {
  if (
    !object(evidence) ||
    typeof evidence.path !== 'string' ||
    !evidence.path ||
    isAbsolute(evidence.path) ||
    !/^[a-f0-9]{64}$/i.test(evidence.sha256 ?? '')
  )
    return false;
  const root = await realpath(baseDir);
  const file = resolve(root, evidence.path);
  const relativePath = relative(root, file);
  if (
    !relativePath ||
    relativePath === '..' ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  )
    return false;
  try {
    const realFile = await realpath(file);
    const realRelative = relative(root, realFile);
    if (
      !realRelative ||
      realRelative === '..' ||
      realRelative.startsWith(`..${sep}`) ||
      isAbsolute(realRelative)
    )
      return false;
    if ((await stat(realFile)).size > 5_000_000) return false;
    const bytes = await readFile(realFile);
    return createHash('sha256').update(bytes).digest('hex') === evidence.sha256.toLowerCase();
  } catch {
    return false;
  }
}

export async function prepareSupplierResponse(
  inventory,
  request,
  { baseDir, locale = 'fr', asOf = new Date().toISOString() } = {},
) {
  if (!locales.includes(locale)) throw Error('Locale must be fr, en or es');
  if (
    !object(inventory) ||
    !Array.isArray(inventory.claims) ||
    !Array.isArray(inventory.evidence) ||
    typeof inventory.supplier !== 'string' ||
    !object(request) ||
    typeof request.buyer !== 'string' ||
    typeof request.lot !== 'string' ||
    !Array.isArray(request.requirements) ||
    !baseDir ||
    !validDate(asOf)
  )
    throw Error(message('invalid', locale));
  const released = [];
  const unresolved = [];
  const requested = new Set();
  for (const requirement of request.requirements) {
    if (!object(requirement) || typeof requirement.claimId !== 'string')
      throw Error(message('invalid', locale));
    const claimId = requirement.claimId;
    if (requested.has(claimId)) throw Error(message('invalid', locale));
    requested.add(claimId);
    const matches = inventory.claims.filter(
      (claim) => claim?.claimId === claimId && claim.lot === request.lot,
    );
    const fail = (code) => unresolved.push({ claimId, code, message: message(code, locale) });
    if (!matches.length) {
      fail('missing');
      continue;
    }
    if (matches.length > 1) {
      fail('conflict');
      continue;
    }
    const claim = matches[0];
    if (!Array.isArray(claim.audiences) || !claim.audiences.includes(request.buyer)) {
      fail('withheld');
      continue;
    }
    const matchesEvidence = inventory.evidence.filter((item) => item?.id === claim.evidenceId);
    if (matchesEvidence.length !== 1) {
      fail('invalidEvidence');
      continue;
    }
    const [evidence] = matchesEvidence;
    if (
      !validDate(claim.validUntil) ||
      Date.parse(claim.validUntil) <= Date.parse(asOf) ||
      !validDate(evidence?.validUntil) ||
      Date.parse(evidence.validUntil) <= Date.parse(asOf)
    ) {
      fail('expired');
      continue;
    }
    if (!(await evidenceMatches(evidence, baseDir))) {
      fail('invalidEvidence');
      continue;
    }
    if (!['string', 'number', 'boolean'].includes(typeof claim.value)) {
      fail('invalidEvidence');
      continue;
    }
    released.push({
      claimId,
      lot: claim.lot,
      value: claim.value,
      ...(claim.unit ? { unit: claim.unit } : {}),
      evidence: { id: evidence.id, sha256: evidence.sha256 },
      validUntil: claim.validUntil,
    });
  }
  return {
    schemaVersion: 1,
    locale,
    supplier: inventory.supplier,
    buyer: request.buyer,
    lot: request.lot,
    notice: message('notice', locale),
    summary: message('summary', locale, {
      released: released.length,
      unresolved: unresolved.length,
    }),
    released,
    unresolved,
  };
}
