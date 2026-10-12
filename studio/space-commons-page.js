import {
  commonsKinds,
  commonsDefaults,
  commonsNotices,
} from '../packages/space-mission-lab/src/commons.js';
import { messageTranslations } from './i18n.js';
export const commonsNames = {
  benchmark: 'Mission Benchmark Commons',
  market: 'Contact Market',
  citizen: 'Citizen Mission',
};
export const escapeCommons = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export function renderCommons(
  kind = 'benchmark',
  locale = 'fr',
  { publicMode = false, summary } = {},
) {
  if (!commonsKinds.includes(kind)) throw new Error('COMMONS_CONFIG');
  const lang = ['fr', 'en', 'es'].includes(locale) ? locale : 'fr',
    index = { fr: 0, en: 1, es: 2 }[lang];
  const t = (key) => messageTranslations[key][index];
  const e = escapeCommons;
  const select = (key, label, values) =>
    `<label>${e(t(label))}<select id="${key}" name="${key}">${values.map(([v, text]) => `<option value="${v}" ${commonsDefaults[kind][key] === v ? 'selected' : ''}>${e(text)}</option>`).join('')}</select></label>`;
  const control =
    kind === 'benchmark'
      ? select('profile', 'commonsProfile', [
          ['iss', t('commonsIss')],
          ['moon', t('commonsMoon')],
        ]) +
        select(
          'stepSec',
          'commonsStep',
          [10, 30, 60, 120].map((v) => [v, String(v)]),
        )
      : kind === 'market'
        ? select(
            'budgetUnits',
            'commonsBudget',
            [50, 100, 200].map((v) => [v, String(v)]),
          ) +
          select('outage', 'commonsOutage', [
            ['none', t('commonsNone')],
            ['paris', 'Paris'],
            ['tenerife', 'Tenerife'],
            ['canberra', 'Canberra'],
          ]) +
          `<label>${t('commonsSeed')}<input id="seed" name="seed" type="number" min="0" max="4294967295" step="1" value="42" required></label>`
        : select(
            'snr',
            'commonsSnr',
            [10, 25, 50].map((v) => [v, String(v)]),
          ) +
          select(
            'maxDriftHzSec',
            'commonsDriftLimit',
            [1, 4].map((v) => [v, String(v)]),
          );
  const description =
    kind === 'benchmark'
      ? t('commonsBenchQuestion')
      : kind === 'market'
        ? t('commonsMarketQuestion')
        : t('commonsCitizenQuestion');
  const route = '/space/commons/' + kind;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${commonsNames[kind]} · ${e(t('commonsTitle'))}</title><meta name="description" content="${e(description)}"><meta property="og:title" content="${commonsNames[kind]}"><meta property="og:description" content="${e(description)}"><meta name="twitter:card" content="summary">${['fr', 'en', 'es'].map((l) => `<link rel="alternate" hreflang="${l}" href="${publicMode ? '/' + l : ''}${route}?lang=${l}">`).join('')}<link rel="stylesheet" href="/space.css"><link rel="stylesheet" href="/space-commons.css"><script type="module" src="/space-commons.js"></script></head><body data-kind="${kind}" data-public="${publicMode}"><header><a class="brand" href="${publicMode ? '/' + lang : ''}/space?lang=${lang}">f↗ <span>frontier / Space Mission Lab</span></a><nav class="header-links" aria-label="FR / EN / ES">${['fr', 'en', 'es'].map((l) => `<a class="commons-language" lang="${l}" href="${publicMode ? '/' + l : ''}${route}?lang=${l}" ${l === lang ? 'aria-current="page"' : ''}>${l.toUpperCase()}</a>`).join('')}</nav></header><main><nav class="commons-tabs" aria-label="SOTA+++">${commonsKinds.map((k) => `<a href="${publicMode ? '/' + lang : ''}/space/commons/${k}?lang=${lang}" ${k === kind ? 'aria-current="page"' : ''}>${commonsNames[k]}</a>`).join('')}<a href="${publicMode ? '/' + lang : ''}/space/explore?lang=${lang}">SOTA ↗</a></nav><section class="hero"><p class="eyebrow">${e(t('commonsBadge'))}</p><h1>${commonsNames[kind]}</h1><p>${e(description)}</p><p class="notice">${e(commonsNotices[kind][lang])}</p>${publicMode ? `<p class="notice">${e(t('commonsStatic'))}</p>` : ''}<a href="${publicMode ? '/' + lang : ''}/space-method?lang=${lang}">${e(t('commonsSetup'))} ↗</a></section><section class="panel"><form id="commons-form"><div class="controls">${control}<button type="button" id="commons-daily">${e(t('commonsDaily'))}</button></div><p id="commons-day"></p><label for="commons-prediction">${e(t('commonsPredict'))}</label><input type="number" step="any" id="commons-prediction" value="${kind === 'citizen' ? '-0.37' : kind === 'market' ? '400' : '5'}"><div class="controls"><button id="commons-replay" type="button">${e(t('commonsReplay'))}</button>${publicMode ? '' : `<button id="commons-run" type="submit">${e(t('commonsRun'))}</button>`}<button type="button" id="commons-check" disabled>${e(t('commonsCheck'))}</button></div></form><p role="status" aria-live="polite" id="commons-status"></p><p id="commons-score"></p><div class="controls"><button type="button" id="commons-share">${e(t('commonsShare'))}</button><button type="button" id="commons-export" disabled>${e(t('commonsExport'))}</button><button type="button" id="commons-card" disabled>${e(t('commonsCard'))}</button></div><label for="commons-link" class="sr-only">${e(t('commonsShare'))}</label><input id="commons-link" readonly type="url"></section><section class="panel"><h2>${e(t('commonsResults'))}</h2><div id="commons-results">${summary ? `<noscript><p>${e(summary)}</p></noscript>` : ''}</div><div id="commons-chart"></div><div class="table-scroll" id="commons-table"></div></section><section class="panel"><h2>${e(t('commonsProvenance'))}</h2><div id="commons-provenance"></div><details><summary>JSON</summary><pre id="commons-json"></pre></details></section><section class="panel"><h2>${e(t('commonsHistory'))}</h2><p>${e(t('commonsHistoryNote'))}</p><div class="table-scroll" id="commons-history"></div></section></main></body></html>`;
}

export function renderCommonsMethod(locale = 'fr') {
  const lang = ['fr', 'en', 'es'].includes(locale) ? locale : 'fr',
    i = { fr: 0, en: 1, es: 2 }[lang],
    e = escapeCommons;
  const texts = [
    [
      'Installation locale : Python 3.11–3.13, compilateur C, make, autotools, curl ; Java 17+ sur Linux. Le script installe les dépendances dans .local/space-runtime et vérifie les SHA-256 des données et archives. Le JDK macOS ARM est fourni automatiquement. Aucune modification des paramètres système de mémoire partagée.',
      'Local setup: Python 3.11–3.13, C compiler, make, autotools, curl; Java 17+ on Linux. The script installs dependencies in .local/space-runtime and verifies dataset and archive SHA-256 hashes. The macOS ARM JDK is downloaded automatically. No system shared-memory settings are changed.',
      'Instalación local: Python 3.11–3.13, compilador C, make, autotools, curl; Java 17+ en Linux. El script instala dependencias en .local/space-runtime y verifica SHA-256 de datos y archivos. El JDK macOS ARM se descarga automáticamente. No se cambian parámetros del sistema de memoria compartida.',
    ],
    [
      'Les résultats publiés sont des calculs réellement exécutés, avec paramètres, versions et empreintes. « Rejouer » relit ces fichiers ; « Exécuter » lance Python, Java et ION. Aucun résultat de secours simulé. Le TLE reste figé pour rendre les défis reproductibles, sans prédiction opérationnelle actuelle.',
      'Published results are actual computations, with parameters, versions and hashes. “Replay” reads these files; “Run” starts Python, Java and ION. No simulated fallback. The TLE stays fixed to make challenges reproducible, without current operational predictions.',
      'Los resultados publicados son cálculos reales, con parámetros, versiones y huellas. «Reproducir» lee estos archivos; «Ejecutar» inicia Python, Java e ION. Sin resultados simulados de sustitución. El TLE permanece fijo para reproducir desafíos, sin predicciones operativas actuales.',
    ],
    [
      'Contact Market utilise CP-SAT, des intervalles optionnels, un budget, des échéances et une seule antenne satellite. Objectif : maximiser la valeur scientifique, puis minimiser le coût. Le statut OPTIMAL ou FEASIBLE et la borne sont exposés ; une vérification indépendante contrôle le calendrier. Le reçu Ed25519 atteste ce calcul local et la réception du manifeste ; il ne représente aucune identité certifiée.',
      'Contact Market uses CP-SAT, optional intervals, a budget, deadlines and one satellite antenna. Objective: maximize scientific value, then minimize cost. OPTIMAL or FEASIBLE status and the bound are exposed; an independent check validates the schedule. The Ed25519 receipt attests this local computation and manifest receipt; it does not represent a certified identity.',
      'Contact Market usa CP-SAT, intervalos opcionales, presupuesto, plazos y una antena de satélite. Objetivo: maximizar valor científico y después minimizar coste. Se muestran estado OPTIMAL o FEASIBLE y cota; una verificación independiente valida el calendario. El recibo Ed25519 atestigua el cálculo local y la recepción del manifiesto; no representa una identidad certificada.',
    ],
    [
      'Le fichier Voyager est distribué en HTTP par son hébergeur historique ; son empreinte est épinglée, sans signature scientifique indépendante. Le spectrogramme regroupe les canaux par maximum pour rendre la porteuse visible ; turboSETI travaille sur les canaux d’origine. Les scores de prédiction sont pédagogiques, sans récompense monétaire.',
      'The Voyager file is distributed over HTTP by its historical host; its hash is pinned, without an independent scientific signature. The waterfall groups channels by maximum to display the carrier; turboSETI uses the original channels. Prediction scores are educational, without monetary rewards.',
      'El archivo Voyager se distribuye por HTTP en su servidor histórico; su huella está fijada, sin firma científica independiente. El espectrograma agrupa canales por máximo para mostrar la portadora; turboSETI usa los canales originales. Las puntuaciones son educativas, sin recompensas monetarias.',
    ],
    [
      'Les URL versionnées transportent uniquement les paramètres. Défi quotidien UTC, prédiction chiffrée, historique local, preuve JSON et carte PNG. Le site statique exporté ne publie pas les API locales ; il rejoue les configurations enregistrées. Les autres configurations nécessitent les moteurs locaux. Aucun trafic n’est mesuré par défaut.',
      'Versioned URLs carry only parameters. Daily UTC challenge, numerical prediction, local history, JSON evidence and PNG card. The exported static site does not publish local APIs; it replays recorded configurations. Other configurations require local engines. No traffic is measured by default.',
      'Las URL versionadas solo transportan parámetros. Desafío diario UTC, predicción numérica, historial local, prueba JSON y tarjeta PNG. El sitio estático exportado no publica las API locales; reproduce configuraciones guardadas. Otros casos necesitan motores locales. No se mide tráfico por defecto.',
    ],
  ];
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(messageTranslations.commonsSetup[i])} · Space Mission Lab</title><link rel="stylesheet" href="/space.css"></head><body><header><a class="brand" href="/space/commons/benchmark?lang=${lang}">f↗ <span>Space Mission Lab</span></a><nav class="header-links">${['fr', 'en', 'es'].map((l) => `<a href="?lang=${l}">${l.toUpperCase()}</a>`).join('')}</nav></header><main><h1>${e(messageTranslations.commonsSetup[i])}</h1>${texts.map((row) => `<p class="notice">${e(row[i])}</p>`).join('')}<pre>npm run space:setup\nnpm run space:test:engines\nnpm run space:fixtures\nnpm run space:public</pre>${commonsKinds.map((k) => `<h2>${commonsNames[k]}</h2><p>${e(commonsNotices[k][lang])}</p>`).join('')}<p><a href="https://avslab.github.io/basilisk/">Basilisk</a> · <a href="https://www.orekit.org/">Orekit</a> · <a href="https://github.com/nasa-jpl/ION-DTN">ION</a> · <a href="https://developers.google.com/optimization">OR-Tools</a> · <a href="https://github.com/UCBerkeleySETI/blimpy">blimpy</a> · <a href="https://github.com/UCBerkeleySETI/turbo_seti">turboSETI</a> · <a href="https://naif.jpl.nasa.gov/naif/rules.html">JPL/NAIF</a></p></main></body></html>`;
}
