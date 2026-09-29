#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { compareProvenance, probeLocalFiles } from '../src/index.js';

const usage = {
  fr: 'Usage : provenance-last-mile demo | compare entree.json [rapport.json] | probe source.jpg publie.jpg [--validator=c2patool] [--locale=fr|en|es]',
  en: 'Usage: provenance-last-mile demo | compare input.json [report.json] | probe source.jpg published.jpg [--validator=c2patool] [--locale=fr|en|es]',
  es: 'Uso: provenance-last-mile demo | compare entrada.json [informe.json] | probe origen.jpg publicado.jpg [--validator=c2patool] [--locale=fr|en|es]',
};
const failure = {
  fr: 'Comparaison impossible : vérifiez les fichiers et c2patool.',
  en: 'Comparison failed: check the files and c2patool.',
  es: 'No se pudo comparar: comprueba los archivos y c2patool.',
};
const args = process.argv.slice(2);
const locale = args.find((arg) => arg.startsWith('--locale='))?.slice(9) ?? 'fr';
const validator = args.find((arg) => arg.startsWith('--validator='))?.slice(12) ?? 'c2patool';
const [command, first, second] = args.filter(
  (arg) => !arg.startsWith('--locale=') && !arg.startsWith('--validator='),
);
if (!Object.hasOwn(usage, locale)) {
  console.error('Locale / Langue / Idioma: fr, en, es');
  process.exitCode = 2;
} else if (
  !['demo', 'compare', 'probe'].includes(command) ||
  (command === 'compare' && !first) ||
  (command === 'probe' && (!first || !second))
) {
  console.log(usage[locale]);
  if (command) process.exitCode = 2;
} else {
  try {
    const report =
      command === 'probe'
        ? await probeLocalFiles([first, second], { locale, validator })
        : compareProvenance(
            JSON.parse(
              await readFile(
                command === 'demo'
                  ? fileURLToPath(new URL('../fixtures/sample.json', import.meta.url))
                  : first,
                'utf8',
              ),
            ),
            { locale },
          );
    const json = JSON.stringify(report, null, 2);
    if (second && command === 'compare') await writeFile(second, json, { flag: 'wx', mode: 0o600 });
    else console.log(json);
  } catch {
    console.error(failure[locale]);
    process.exitCode = 2;
  }
}
