import { mkdir, writeFile, readFile, readdir, copyFile, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { renderCommons, renderCommonsMethod, escapeCommons } from '../studio/space-commons-page.js';
import { renderSpaceAtlas } from '../studio/space-atlas.js';
import { readCommonsEvidence } from '../packages/space-mission-lab/src/commons-engine.js';
import { commonsKinds, commonsDefaults } from '../packages/space-mission-lab/src/commons.js';
import { buildSpaceCards } from './space-cards.mjs';
import { messageTranslations } from '../studio/i18n.js';
const output = resolve('output/space-public'),
  evidence = resolve('packages/space-mission-lab/fixtures/commons'),
  requestedOrigin = process.env.SPACE_PUBLIC_ORIGIN;
const parsedOrigin = requestedOrigin ? new URL(requestedOrigin) : null;
const origin = parsedOrigin?.origin;
if (
  parsedOrigin &&
  (parsedOrigin.protocol !== 'https:' ||
    parsedOrigin.pathname !== '/' ||
    parsedOrigin.search ||
    parsedOrigin.hash ||
    parsedOrigin.username ||
    parsedOrigin.password)
)
  throw new Error('HTTPS_ORIGIN_REQUIRED');
await mkdir(output, { recursive: true });
async function save(path, content) {
  const file = resolve(output, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content);
}
for (const file of ['style.css', 'space.css', 'space-commons.css', 'space-commons.js', 'i18n.js'])
  await copyFile(resolve('studio', file), resolve(output, file));
await save(
  'space-lib/commons.js',
  await readFile('packages/space-mission-lab/src/commons.js', 'utf8'),
);
await mkdir(resolve(output, 'space-evidence'), { recursive: true });
await rm(resolve(output, 'space-evidence'), { recursive: true, force: true });
await mkdir(resolve(output, 'space-evidence'));
const reports = [];
for (const file of await readdir(evidence)) {
  if (!file.endsWith('.json')) continue;
  const report = JSON.parse(await readFile(resolve(evidence, file), 'utf8'));
  const valid = await readCommonsEvidence(report.kind, report.config, evidence);
  reports.push({
    id: valid.id,
    kind: valid.kind,
    config: valid.config,
    executedAt: valid.executedAt,
    evidenceSha256: valid.evidenceSha256,
  });
  await save('space-evidence/' + file, JSON.stringify(valid));
}
function localize(html, locale, route = '/space/explore/') {
  return html
    .replace(/href="(\/space(?:[/?]|-method)[^"]*)"/g, (_, path) => `href="/${locale}${path}"`)
    .replace(/href="\?lang=(fr|en|es)"/g, (_, l) => `href="/${l}${route}?lang=${l}"`);
}
const paths = [];
for (const [index, locale] of ['fr', 'en', 'es'].entries()) {
  for (const kind of commonsKinds) {
    const r = await readCommonsEvidence(kind, commonsDefaults[kind], evidence);
    const summary =
      kind === 'benchmark'
        ? `${r.result.maxEngineDifferenceM.toFixed(3)} m · Basilisk / Orekit`
        : kind === 'market'
          ? `${r.result.scienceValue} · OR-Tools CP-SAT · ION BPv7/UDP`
          : `${r.result.measuredPeakDriftHzSec.toFixed(5)} Hz/s · Voyager 1 · turboSETI`;
    let html = renderCommons(kind, locale, { publicMode: true, summary });
    html = localize(html, locale).replace(
      /href="\/(fr|en|es)(\/space\/commons\/[^?"]+)\?lang=(fr|en|es)" lang/g,
      (_, current, path, target) => `href="/${target}${path}?lang=${target}" lang`,
    );
    if (origin)
      html = html.replace(
        '</head>',
        `<link rel="canonical" href="${origin.replace(/\/$/, '')}/${locale}/space/commons/${kind}/"><meta property="og:url" content="${origin.replace(/\/$/, '')}/${locale}/space/commons/${kind}/"><meta property="og:image" content="${origin.replace(/\/$/, '')}/space-cards/${kind}-${locale}.png"></head>`,
      );
    const path = `${locale}/space/commons/${kind}/index.html`;
    await save(path, html);
    paths.push('/' + path.replace('index.html', ''));
    if (locale === 'fr') await save(`space/commons/${kind}/index.html`, html);
  }
  await save(`${locale}/space/explore/index.html`, localize(renderSpaceAtlas(locale), locale));
  await save(
    `${locale}/space-method/index.html`,
    localize(renderCommonsMethod(locale), locale, '/space-method/'),
  );
  const title = messageTranslations.commonsTitle[index],
    intro = messageTranslations.commonsIntro[index];
  const hub = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeCommons(title)}</title><meta name="description" content="${escapeCommons(intro)}"><link rel="stylesheet" href="/space.css"></head><body><header><a class="brand" href="/${locale}/space/">f↗ <span>Space Mission Lab</span></a><nav class="header-links">${['fr', 'en', 'es'].map((l) => `<a href="/${l}/space/">${l.toUpperCase()}</a>`).join('')}</nav></header><main><section class="hero"><h1>${escapeCommons(title)}</h1><p>${escapeCommons(intro)}</p><p>${escapeCommons(messageTranslations.commonsStatic[index])}</p></section><div class="panels">${commonsKinds.map((k) => `<article class="panel"><h2><a href="/${locale}/space/commons/${k}/?lang=${locale}">${{ benchmark: 'Mission Benchmark Commons', market: 'Contact Market', citizen: 'Citizen Mission' }[k]} ↗</a></h2></article>`).join('')}</div><p><a href="/${locale}/space/explore/">SOTA ↗</a> · <a href="/${locale}/space-method/">${escapeCommons(messageTranslations.commonsSetup[index])} ↗</a></p></main></body></html>`;
  await save(`${locale}/space/index.html`, hub);
  paths.push(`/${locale}/space/`, `/${locale}/space/explore/`, `/${locale}/space-method/`);
  if (locale === 'fr') {
    await save('index.html', hub);
    await save('space/index.html', hub);
    await save('space/explore/index.html', localize(renderSpaceAtlas(locale), locale));
    await save(
      'space-method/index.html',
      localize(renderCommonsMethod(locale), locale, '/space-method/'),
    );
  }
}
await save(
  'manifest.json',
  JSON.stringify(
    {
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      reports,
      localAPIsPublished: false,
      languages: ['fr', 'en', 'es'],
    },
    null,
    2,
  ),
);
if (origin) {
  await save(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${origin.replace(/\/$/, '') + path}</loc></url>`).join('')}</urlset>`,
  );
  await save(
    'robots.txt',
    'User-agent: *\nAllow: /\nSitemap: ' + origin.replace(/\/$/, '') + '/sitemap.xml\n',
  );
} else await save('robots.txt', 'User-agent: *\nAllow: /\n');
await save(
  '_headers',
  "/*\n  X-Content-Type-Options: nosniff\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-ancestors 'none'\n",
);
if (!process.argv.includes('--no-cards')) await buildSpaceCards(output);
console.log(
  `FR : édition statique prête. EN: static edition ready. ES: edición estática lista. ${output} · ${reports.length} preuves / computations / cálculos`,
);
