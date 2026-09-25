const fail = (code, message) => {
  throw Object.assign(new Error(message), { code });
};

export function normalizeScreenText(value) {
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .trim();
}

export function screenLines(observations) {
  if (!Array.isArray(observations)) fail('INVALID_SCREEN', 'OCR observations array required');
  return [
    ...new Set(
      observations
        .filter((row) => row && typeof row.text === 'string' && (row.confidence ?? 1) >= 0.45)
        .map((row) => row.text.trim())
        .filter((line) => line.length >= 3),
    ),
  ].slice(0, 120);
}

const defaultTitles = {
  fr: 'Procédure observée',
  en: 'Observed workflow',
  es: 'Procedimiento observado',
};
const defaultInstructions = {
  fr: (index) => (index === 0 ? 'Écran de départ' : `Passer à l’écran ${index + 1}`),
  en: (index) => (index === 0 ? 'Starting screen' : `Move to screen ${index + 1}`),
  es: (index) => (index === 0 ? 'Pantalla inicial' : `Pasar a la pantalla ${index + 1}`),
};
const limitations = {
  fr: [
    'Les clics, si autorisés, indiquent une position sur un écran entier, pas l’identité du contrôle.',
    'Un repère textuel prouve un état affiché, pas une transaction métier.',
    'Les étapes sans texte distinctif exigent une confirmation manuelle.',
    'Ce guide suit une exécution ; il ne clique ni ne saisit dans les autres applications.',
  ],
  en: [
    'Opt-in clicks record a position on a full screen, not the identity of the control.',
    'A detected text checkpoint is evidence of screen state, not proof of a business transaction.',
    'Steps without distinctive text require manual confirmation.',
    'This guide watches an execution; it does not click or type in other apps.',
  ],
  es: [
    'Los clics autorizados indican una posición en una pantalla completa, no la identidad del control.',
    'Una referencia textual demuestra un estado visible, no una transacción de negocio.',
    'Los pasos sin texto distintivo requieren confirmación manual.',
    'Esta guía sigue una ejecución; no hace clic ni escribe en otras aplicaciones.',
  ],
};
export function compileVisualSkill(
  frames,
  { title, selected, labels = {}, locale = 'fr', clickCapture = { enabled: false } } = {},
) {
  if (!['fr', 'en', 'es'].includes(locale)) fail('INVALID_LOCALE', 'Locale must be fr, en or es');
  title ??= defaultTitles[locale];
  if (!Array.isArray(frames) || frames.length < 2 || frames.length > 120)
    fail('NEED_SCREENS', 'At least two and at most 120 captured screens are required');
  const picks = selected ?? frames.map((f) => f.index);
  if (!Array.isArray(picks) || picks.length < 2 || picks.length > 120)
    fail('NEED_SCREENS', 'Select at least two captured screens');
  if (
    picks.some(
      (n, i) =>
        !Number.isSafeInteger(n) || !frames.some((f) => f.index === n) || (i && n <= picks[i - 1]),
    )
  )
    fail('INVALID_SELECTION', 'Selected screens must be unique and in capture order');
  if (typeof title !== 'string' || !title.trim() || title.length > 120)
    fail('INVALID_TITLE', 'A short procedure title is required');
  const steps = [];
  let previous = new Set();
  let previousFrameIndex = -1;
  for (const [stepIndex, frameIndex] of picks.entries()) {
    const frame = frames.find((f) => f.index === frameIndex);
    const interactions = frames
      .filter((candidate) => candidate.index > previousFrameIndex && candidate.index <= frameIndex)
      .flatMap((candidate) => candidate.clicks ?? [])
      .map(({ atMs, button, x, y }) => ({ atMs, button, x, y }));
    const lines = screenLines(frame.ocr);
    const current = new Set(lines.map(normalizeScreenText));
    const added = lines.filter((line) => !previous.has(normalizeScreenText(line))).slice(0, 16);
    const removed = [...previous].filter((line) => !current.has(line)).slice(0, 16);
    const rawLabel = labels[String(frameIndex)] ?? '';
    if (typeof rawLabel !== 'string' || rawLabel.length > 200)
      fail('INVALID_LABEL', 'Step labels must be short strings');
    const markers = (stepIndex === 0 ? lines : added)
      .filter((line) => line.length >= 4)
      .slice(0, 6);
    const instructionTranslations = rawLabel.trim()
      ? null
      : Object.fromEntries(
          ['fr', 'en', 'es'].map((language) => [
            language,
            defaultInstructions[language](stepIndex),
          ]),
        );
    steps.push({
      index: stepIndex,
      frameIndex,
      atMs: frame.atMs,
      instruction: rawLabel.trim() || instructionTranslations[locale],
      ...(instructionTranslations ? { instructionTranslations } : {}),
      detectedText: lines,
      appeared: added,
      disappeared: removed,
      markers,
      autoDetectable: markers.length > 0,
      interactions,
    });
    previous = current;
    previousFrameIndex = frameIndex;
  }
  return {
    schemaVersion: 1,
    kind: 'visual-guide',
    title: title.trim(),
    locale,
    steps,
    source: {
      method: 'screen-capture-local-ocr',
      reviewed: true,
      selectedFrames: picks.length,
      clickCapture,
    },
    limitations: limitations[locale],
  };
}

export function matchVisualStep(step, observations) {
  if (!step || !Array.isArray(step.markers)) fail('INVALID_STEP', 'Visual guide step required');
  const seen = screenLines(observations).map(normalizeScreenText);
  const markers = step.markers.map(normalizeScreenText).filter(Boolean);
  if (!markers.length) return { matched: false, score: 0, matchedMarkers: [], missingMarkers: [] };
  const matchedMarkers = markers.filter((want) =>
    seen.some((line) => line === want || line.includes(want)),
  );
  const score = matchedMarkers.length / markers.length;
  return {
    matched: score >= 0.7,
    score,
    matchedMarkers,
    missingMarkers: markers.filter((m) => !matchedMarkers.includes(m)),
  };
}
