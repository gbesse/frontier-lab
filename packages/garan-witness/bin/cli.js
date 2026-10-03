#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { auditWarrantyJourney, probeWarrantyJourney } from '../src/index.js';

const locale = process.argv.find((arg) => arg.startsWith('--locale='))?.slice(9) ?? 'fr';
const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--locale='));
const usage = {
  fr: 'Usage : garan-witness demo | audit observations.json | probe pages.json [rapport.json] [--locale=fr|en|es]',
  en: 'Usage: garan-witness demo | audit observations.json | probe pages.json [report.json] [--locale=fr|en|es]',
  es: 'Uso: garan-witness demo | audit observaciones.json | probe paginas.json [informe.json] [--locale=fr|en|es]',
};
const failure = {
  fr: 'Audit impossible : vérifiez les pages et les observations.',
  en: 'Audit failed: check pages and observations.',
  es: 'No se pudo auditar: comprueba las páginas y observaciones.',
};
if (!Object.hasOwn(usage, locale)) {
  console.error('Locale / Langue / Idioma: fr, en, es');
  process.exitCode = 2;
} else if (!['demo', 'audit', 'probe'].includes(args[0]) || (args[0] !== 'demo' && !args[1])) {
  console.log(usage[locale]);
  if (args[0]) process.exitCode = 2;
} else {
  try {
    const path =
      args[0] === 'demo'
        ? fileURLToPath(new URL('../fixtures/sample.json', import.meta.url))
        : args[1];
    const input = JSON.parse(await readFile(path, 'utf8'));
    const report =
      args[0] === 'probe'
        ? await probeWarrantyJourney(input, { locale })
        : auditWarrantyJourney(input, { locale });
    const output = JSON.stringify(report, null, 2);
    if (args[2]) await writeFile(args[2], output, { flag: 'wx', mode: 0o600 });
    else console.log(output);
  } catch {
    console.error(failure[locale]);
    process.exitCode = 2;
  }
}
