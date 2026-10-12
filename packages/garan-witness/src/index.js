import { chromium } from 'playwright';

const locales = ['fr', 'en', 'es'];
const words = {
  invalid: ['Configuration invalide.', 'Invalid configuration.', 'Configuración no válida.'],
  notice: [
    'Observation du rendu uniquement : ni validation juridique, ni authentification du graphisme officiel. Vérification humaine nécessaire.',
    'Rendered-page observation only: neither legal validation nor official-artwork authentication. Human review is required.',
    'Solo observación de la página mostrada: no valida el derecho ni autentica el diseño oficial. Requiere revisión humana.',
  ],
  summary: [
    '{count} point(s) à revoir sur {pages} page(s).',
    '{count} finding(s) across {pages} page(s).',
    '{count} punto(s) por revisar en {pages} página(s).',
  ],
  PAGE_FAILED: ['Page inaccessible.', 'Page could not be loaded.', 'No se pudo cargar la página.'],
  NOTICE_MISSING: [
    'Notice attendue non visible.',
    'Expected notice not visible.',
    'El aviso esperado no está visible.',
  ],
  NOTICE_TEXT: [
    'Texte attendu absent de la notice.',
    'Expected notice text is absent.',
    'Falta el texto esperado del aviso.',
  ],
  GARAN_MISSING: [
    'Label GARAN attendu non visible.',
    'Expected GARAN label not visible.',
    'La etiqueta GARAN esperada no está visible.',
  ],
  GARAN_UNEXPECTED: [
    'Label GARAN visible sans garantie déclarée.',
    'GARAN label visible without a declared guarantee.',
    'Etiqueta GARAN visible sin garantía declarada.',
  ],
  GARAN_TEXT: [
    'Texte attendu absent du label GARAN.',
    'Expected GARAN label text is absent.',
    'Falta el texto esperado de la etiqueta GARAN.',
  ],
  LOCALE_MISMATCH: [
    'Langue de page différente de la langue attendue.',
    'Page language differs from expected language.',
    'El idioma de la página difiere del esperado.',
  ],
};
const msg = (key, locale, vars = {}) => {
  const index = locales.indexOf(locale);
  if (index < 0) throw Error('Locale / Langue / Idioma: fr, en, es');
  return words[key][index].replace(/\{(\w+)\}/g, (_, name) => vars[name]);
};
const object = (v) => v && typeof v === 'object' && !Array.isArray(v);
const string = (v) => typeof v === 'string' && v.trim() !== '';
const safeUrl = (value) => {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
    throw Error('url');
  return url;
};

export function auditWarrantyJourney(input, { locale = 'fr' } = {}) {
  msg('invalid', locale);
  if (!object(input) || !Array.isArray(input.pages) || input.pages.length === 0)
    throw Error(msg('invalid', locale));
  const ids = new Set();
  const pages = input.pages.map((page) => {
    if (
      !object(page) ||
      !string(page.id) ||
      ids.has(page.id) ||
      !locales.includes(page.expectedLocale) ||
      !string(page.url) ||
      !string(page.noticeSelector) ||
      !string(page.garanSelector) ||
      typeof page.expectGaran !== 'boolean' ||
      !object(page.observation)
    )
      throw Error(msg('invalid', locale));
    ids.add(page.id);
    try {
      safeUrl(page.url);
    } catch {
      throw Error(msg('invalid', locale));
    }
    const seen = page.observation;
    if (!['ok', 'error'].includes(seen.status)) throw Error(msg('invalid', locale));
    const findings = [];
    const add = (code) => findings.push({ code, message: msg(code, locale) });
    if (seen.status === 'error') add('PAGE_FAILED');
    else {
      if (
        String(seen.documentLocale ?? '')
          .split('-')[0]
          .toLowerCase() !== page.expectedLocale
      )
        add('LOCALE_MISMATCH');
      if (seen.noticeVisible !== true) add('NOTICE_MISSING');
      else if (
        string(page.expectedNoticeText) &&
        !String(seen.noticeText ?? '').includes(page.expectedNoticeText)
      )
        add('NOTICE_TEXT');
      if (page.expectGaran && seen.garanVisible !== true) add('GARAN_MISSING');
      if (!page.expectGaran && seen.garanVisible === true) add('GARAN_UNEXPECTED');
      if (
        page.expectGaran &&
        seen.garanVisible === true &&
        string(page.expectedGaranText) &&
        !String(seen.garanText ?? '').includes(page.expectedGaranText)
      )
        add('GARAN_TEXT');
    }
    return {
      id: page.id,
      url: page.url,
      expectedLocale: page.expectedLocale,
      stage: page.stage ?? null,
      status: seen.status,
      documentLocale: seen.documentLocale ?? null,
      noticeVisible: seen.noticeVisible ?? false,
      garanVisible: seen.garanVisible ?? false,
      findings,
    };
  });
  const count = pages.reduce((sum, page) => sum + page.findings.length, 0);
  return {
    schemaVersion: 1,
    locale,
    notice: msg('notice', locale),
    summary: msg('summary', locale, { count, pages: pages.length }),
    pages,
  };
}

export async function probeWarrantyJourney(
  input,
  { locale = 'fr', browser, timeoutMs = 10000 } = {},
) {
  msg('invalid', locale);
  if (
    !object(input) ||
    !Array.isArray(input.pages) ||
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs < 1000 ||
    timeoutMs > 30000
  )
    throw Error(msg('invalid', locale));
  const owned = browser ?? (await chromium.launch({ headless: true }));
  try {
    const context = await owned.newContext({ serviceWorkers: 'block', acceptDownloads: false });
    const pages = [];
    for (const page of input.pages) {
      if (
        !object(page) ||
        !string(page.url) ||
        !string(page.noticeSelector) ||
        !string(page.garanSelector)
      )
        throw Error(msg('invalid', locale));
      safeUrl(page.url);
      const tab = await context.newPage();
      let observation;
      try {
        await tab.goto(page.url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
        const notice = tab.locator(page.noticeSelector).first();
        const garan = tab.locator(page.garanSelector).first();
        const noticeVisible = await notice.isVisible();
        const garanVisible = await garan.isVisible();
        observation = {
          status: 'ok',
          documentLocale: await tab.locator('html').getAttribute('lang'),
          noticeVisible,
          noticeText: noticeVisible ? await notice.innerText() : '',
          garanVisible,
          garanText: garanVisible ? await garan.innerText() : '',
        };
      } catch {
        observation = { status: 'error' };
      } finally {
        await tab.close();
      }
      pages.push({ ...page, observation });
    }
    await context.close();
    return auditWarrantyJourney({ pages }, { locale });
  } finally {
    if (!browser) await owned.close();
  }
}
