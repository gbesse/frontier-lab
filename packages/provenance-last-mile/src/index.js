import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const locales = ['fr', 'en', 'es'];
const words = {
  invalid: ['Entrée invalide.', 'Invalid input.', 'Entrada no válida.'],
  notice: [
    'Comparaison de sorties c2patool ; ce rapport ne prouve ni l’identité du signataire ni la véracité du contenu.',
    'Comparison of c2patool outputs; this report proves neither signer identity nor content truth.',
    'Comparación de resultados de c2patool; este informe no prueba la identidad del firmante ni la veracidad del contenido.',
  ],
  preserved: [
    'Même manifeste actif présent aux deux étapes.',
    'Same active manifest present at both stages.',
    'El mismo manifiesto activo está presente en ambas etapas.',
  ],
  absent: [
    'Aucun manifeste actif dans cette étape.',
    'No active manifest at this stage.',
    'No hay manifiesto activo en esta etapa.',
  ],
  invalidManifest: [
    'Échec de validation signalé par c2patool.',
    'Validation failure reported by c2patool.',
    'Fallo de validación indicado por c2patool.',
  ],
  changed: [
    'Manifeste actif différent : transformation à examiner.',
    'Different active manifest: review the transformation.',
    'Manifiesto activo diferente: revisa la transformación.',
  ],
  unverified: [
    'Manifeste présent mais état de validation non confirmé.',
    'Manifest present but validation state not confirmed.',
    'Manifiesto presente, pero estado de validación sin confirmar.',
  ],
  sourceAbsent: [
    'La source ne possède pas de manifeste actif ; aucune continuité à démontrer.',
    'Source has no active manifest; continuity cannot be demonstrated.',
    'El origen no tiene manifiesto activo; no se puede demostrar continuidad.',
  ],
};
const msg = (key, locale) => {
  if (!locales.includes(locale)) throw Error('Locale / Langue / Idioma: fr, en, es');
  return words[key][locales.indexOf(locale)];
};
const obj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const nonempty = (v) => typeof v === 'string' && v.trim().length > 0;
const validHash = (v) => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
const failed = (v) =>
  v.validation_state === 'Invalid' ||
  (Array.isArray(v.validation_status) && v.validation_status.length > 0) ||
  (Array.isArray(v.validation_results?.activeManifest?.failure) &&
    v.validation_results.activeManifest.failure.length > 0);

export function compareProvenance(input, { locale = 'fr' } = {}) {
  msg('invalid', locale);
  if (!obj(input) || !Array.isArray(input.stages) || input.stages.length < 2)
    throw Error(msg('invalid', locale));
  const labels = new Set();
  for (const stage of input.stages) {
    if (
      !obj(stage) ||
      !nonempty(stage.label) ||
      !validHash(stage.sha256) ||
      !obj(stage.validator) ||
      labels.has(stage.label)
    )
      throw Error(msg('invalid', locale));
    labels.add(stage.label);
  }
  const source = input.stages[0].validator;
  const sourceManifest = source.active_manifest;
  const stages = input.stages.map((stage, index) => {
    const v = stage.validator;
    const manifest = nonempty(v.active_manifest) ? v.active_manifest : null;
    const code = !sourceManifest
      ? 'sourceAbsent'
      : !manifest
        ? 'absent'
        : failed(v)
          ? 'invalidManifest'
          : v.validation_state !== 'Valid'
            ? 'unverified'
            : index > 0 && manifest !== sourceManifest
              ? 'changed'
              : 'preserved';
    return {
      label: stage.label,
      sha256: stage.sha256,
      activeManifest: manifest,
      validationState: nonempty(v.validation_state) ? v.validation_state : 'unknown',
      code,
      message: msg(code, locale),
    };
  });
  return {
    schemaVersion: 1,
    locale,
    notice: msg('notice', locale),
    continuity: stages.every((stage) => stage.code === 'preserved'),
    stages,
  };
}

export async function probeLocalFiles(
  files,
  { locale = 'fr', validator = 'c2patool', runValidator } = {},
) {
  msg('invalid', locale);
  if (!Array.isArray(files) || files.length < 2 || !files.every(nonempty) || !nonempty(validator))
    throw Error(msg('invalid', locale));
  const run =
    runValidator ??
    (async (file) => {
      const { stdout } = await exec(validator, [file], {
        timeout: 30000,
        maxBuffer: 8 * 1024 * 1024,
      });
      return JSON.parse(stdout);
    });
  const stages = [];
  for (const [index, file] of files.entries()) {
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(file)) hash.update(chunk);
    const validatorOutput = await run(file);
    if (!obj(validatorOutput)) throw Error(msg('invalid', locale));
    stages.push({
      label: index === 0 ? 'source' : `published-${index}`,
      sha256: hash.digest('hex'),
      validator: validatorOutput,
    });
  }
  return compareProvenance({ stages }, { locale });
}
