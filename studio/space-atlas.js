import { spaceAtlas } from '../packages/space-mission-lab/src/atlas.js';
import { sharedFrontier } from '../packages/space-mission-lab/src/frontier-config.js';
import { messageTranslations } from './i18n.js';
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );
export function renderSpaceAtlas(locale = 'fr') {
  const atlas = spaceAtlas(locale),
    index = { fr: 0, en: 1, es: 2 }[atlas.locale];
  const t = (key, params = {}) =>
    messageTranslations[key][index].replace(/\{(\w+)\}/g, (_, name) => params[name] ?? '');
  const label = (stage) => t('atlas' + stage[0].toUpperCase() + stage.slice(1));
  const challenge = new URL(
    sharedFrontier('http://localhost', { locale: atlas.locale, destination: 'proxima' }),
  );
  const href = challenge.pathname + challenge.search + challenge.hash;
  return `<!doctype html><html lang="${atlas.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(t('atlasTitle'))} · Frontier</title><meta name="description" content="${escape(t('atlasIntro'))}"><meta property="og:title" content="${escape(t('atlasTitle'))}"><meta property="og:description" content="${escape(t('atlasIntro'))}">${['fr', 'en', 'es'].map((lang) => `<link rel="alternate" hreflang="${lang}" href="/space/explore?lang=${lang}">`).join('')}<link rel="stylesheet" href="/space.css"></head><body><header><a href="/space?lang=${atlas.locale}" class="brand">f↗ <span>frontier / Space Mission Lab</span></a><nav class="header-links" aria-label="FR / EN / ES">${['fr', 'en', 'es'].map((lang) => `<a href="?lang=${lang}" lang="${lang}" ${lang === atlas.locale ? 'aria-current="page"' : ''}>${lang.toUpperCase()}</a>`).join('')}</nav></header><main><section class="hero"><p class="eyebrow">SPACE MISSION LAB / SOTA</p><h1>${escape(t('atlasTitle'))}</h1><p>${escape(t('atlasIntro'))}</p><p class="notice">${escape(t('atlasDate', { date: atlas.reviewedAt }))}</p><a class="challenge-cta" href="${escape(href)}">${escape(t('atlasTry'))} ↗</a></section><div class="panels atlas-grid">${atlas.entries.map((entry) => `<article class="panel" id="${escape(entry.id)}"><p class="eyebrow">${escape(label(entry.stage))}</p><h2>${escape(entry.name)}</h2><p>${escape(entry.text)}</p><div class="source-links">${entry.sources.map(([name, url]) => `<a href="${escape(url)}" rel="noopener noreferrer">${escape(name)} ↗</a>`).join('')}</div></article>`).join('')}</div><section class="hero"><h2>${escape(t('atlasIdeas'))}</h2></section><div class="panels">${atlas.ideas.map((idea) => `<article class="panel"><p class="eyebrow">${escape(label(idea.state))}</p><h2>${escape(idea.name)}</h2><p>${escape(idea.text)}</p>${idea.state === 'built' ? `<a href="${escape(idea.href ? idea.href + '?lang=' + atlas.locale : href)}">${escape(t('atlasTry'))} ↗</a>` : ''}</article>`).join('')}</div></main></body></html>`;
}
