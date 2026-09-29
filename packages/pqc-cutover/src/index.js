const locales = ['fr', 'en', 'es'];
const words = {
  invalid: ['Entrée invalide.', 'Invalid input.', 'Entrada no válida.'],
  notice: [
    'Observations de banc fournies par l’utilisateur, non vérifiées. Aucun test réseau ni certificat de sécurité.',
    'User-supplied lab observations, not verified. No network test or security certification.',
    'Observaciones de laboratorio aportadas por el usuario, no verificadas. Sin prueba de red ni certificación de seguridad.',
  ],
  summary: [
    '{systems} systèmes ; {findings} points à examiner.',
    '{systems} systems; {findings} findings to review.',
    '{systems} sistemas; {findings} puntos por revisar.',
  ],
  missingNormal: [
    'Aucun essai normal fourni.',
    'No normal attempt supplied.',
    'No se proporcionó un intento normal.',
  ],
  missingBroken: [
    'Aucun essai avec branche post-quantique défaillante fourni.',
    'No broken post-quantum branch attempt supplied.',
    'No se proporcionó un intento con rama poscuántica fallida.',
  ],
  failedNormal: ['L’essai normal a échoué.', 'Normal attempt failed.', 'El intento normal falló.'],
  classicalFallback: [
    'Un groupe classique a été négocié malgré l’offre hybride.',
    'A classical group was negotiated despite the hybrid offer.',
    'Se negoció un grupo clásico pese a la oferta híbrida.',
  ],
  unexpectedGroup: [
    'Le groupe négocié ne correspond pas au groupe hybride attendu.',
    'Negotiated group differs from the expected hybrid group.',
    'El grupo negociado difiere del grupo híbrido esperado.',
  ],
  downgradeObserved: [
    'La connexion a réussi en mode classique quand la branche post-quantique était défaillante.',
    'Connection succeeded with a classical group when the post-quantum branch failed.',
    'La conexión tuvo éxito con un grupo clásico cuando falló la rama poscuántica.',
  ],
  brokenPathSucceeded: [
    'L’essai avec branche post-quantique défaillante a réussi : vérifier le repli et le banc.',
    'Broken post-quantum branch attempt succeeded: review fallback and the lab.',
    'El intento con rama poscuántica fallida tuvo éxito: revisa el repliegue y el laboratorio.',
  ],
  inconsistentObservation: [
    'Le groupe négocié ne figure pas parmi les groupes offerts déclarés.',
    'Negotiated group is absent from the declared offered groups.',
    'El grupo negociado no figura entre los grupos ofrecidos declarados.',
  ],
  hybridObserved: [
    'Groupe hybride observé sur l’essai normal ; la sécurité globale reste hors périmètre.',
    'Hybrid group observed in the normal attempt; overall security remains out of scope.',
    'Grupo híbrido observado en el intento normal; la seguridad general queda fuera del alcance.',
  ],
};
const msg = (key, locale, values = {}) => {
  if (!locales.includes(locale)) throw Error('Locale / Langue / Idioma: fr, en, es');
  return words[key][locales.indexOf(locale)].replace(/\{(\w+)\}/g, (_, name) => values[name]);
};
const obj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const nonempty = (v) => typeof v === 'string' && v.trim().length > 0;
const classicalGroups = new Set([
  'x25519',
  'x448',
  'secp256r1',
  'secp384r1',
  'secp521r1',
  'p-256',
  'p-384',
  'p-521',
]);

export function analyzePqcCutover(input, { locale = 'fr' } = {}) {
  msg('invalid', locale);
  if (!obj(input) || !Array.isArray(input.systems)) throw Error(msg('invalid', locale));
  const ids = new Set();
  const systems = input.systems.map((system) => {
    if (
      !obj(system) ||
      !nonempty(system.id) ||
      !nonempty(system.owner) ||
      !nonempty(system.expectedHybridGroup) ||
      !Array.isArray(system.observations) ||
      ids.has(system.id)
    )
      throw Error(msg('invalid', locale));
    ids.add(system.id);
    const observationIds = new Set();
    for (const observation of system.observations) {
      if (
        !obj(observation) ||
        !nonempty(observation.id) ||
        !['normal', 'pq_path_broken'].includes(observation.scenario) ||
        typeof observation.success !== 'boolean' ||
        !Array.isArray(observation.offeredGroups) ||
        !observation.offeredGroups.every(nonempty) ||
        (observation.success && !nonempty(observation.negotiatedGroup)) ||
        !nonempty(observation.evidenceRef) ||
        observationIds.has(observation.id)
      )
        throw Error(msg('invalid', locale));
      observationIds.add(observation.id);
    }
    const findings = [];
    const add = (code, observationId) =>
      findings.push({
        code,
        message: msg(code, locale),
        ...(observationId ? { observationId } : {}),
      });
    const normal = system.observations.filter((item) => item.scenario === 'normal');
    const broken = system.observations.filter((item) => item.scenario === 'pq_path_broken');
    if (!normal.length) add('missingNormal');
    if (!broken.length) add('missingBroken');
    for (const item of normal) {
      if (item.success && !item.offeredGroups.includes(item.negotiatedGroup))
        add('inconsistentObservation', item.id);
      if (!item.success) add('failedNormal', item.id);
      else if (item.negotiatedGroup === system.expectedHybridGroup) add('hybridObserved', item.id);
      else if (classicalGroups.has(item.negotiatedGroup.toLowerCase()))
        add('classicalFallback', item.id);
      else add('unexpectedGroup', item.id);
    }
    for (const item of broken) {
      if (item.success && !item.offeredGroups.includes(item.negotiatedGroup))
        add('inconsistentObservation', item.id);
      if (item.success) {
        add('brokenPathSucceeded', item.id);
        if (classicalGroups.has(item.negotiatedGroup.toLowerCase()))
          add('downgradeObserved', item.id);
      }
    }
    return {
      id: system.id,
      owner: system.owner,
      expectedHybridGroup: system.expectedHybridGroup,
      observations: system.observations.map((item) => ({
        id: item.id,
        scenario: item.scenario,
        success: item.success,
        offeredGroups: item.offeredGroups,
        negotiatedGroup: item.negotiatedGroup ?? null,
        evidenceRef: item.evidenceRef,
      })),
      findings,
    };
  });
  const concerning = new Set([
    'missingNormal',
    'missingBroken',
    'failedNormal',
    'classicalFallback',
    'unexpectedGroup',
    'downgradeObserved',
    'brokenPathSucceeded',
    'inconsistentObservation',
  ]);
  const count = systems.reduce(
    (total, system) => total + system.findings.filter((item) => concerning.has(item.code)).length,
    0,
  );
  return {
    schemaVersion: 1,
    locale,
    notice: msg('notice', locale),
    summary: msg('summary', locale, { systems: systems.length, findings: count }),
    systems,
  };
}
