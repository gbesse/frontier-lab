#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { assessAgeProof, scanHarForCanaries } from '../src/index.js';

const locale = process.argv.find((arg) => arg.startsWith('--locale='))?.slice(9) ?? 'fr';
const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--locale='));
const usage = {
  fr: 'Usage : age-proof-lab demo | assess observations.json [rapport.json] | scan-har capture.har.json politique.json [rapport.json] [--locale=fr|en|es]',
  en: 'Usage: age-proof-lab demo | assess observations.json [report.json] | scan-har capture.har.json policy.json [report.json] [--locale=fr|en|es]',
  es: 'Uso: age-proof-lab demo | assess observaciones.json [informe.json] | scan-har captura.har.json politica.json [informe.json] [--locale=fr|en|es]',
};
const failure = {
  fr: 'Analyse impossible : vérifiez les fichiers synthétiques.',
  en: 'Analysis failed: check the synthetic files.',
  es: 'No se pudo analizar: comprueba los archivos sintéticos.',
};
if (!Object.hasOwn(usage, locale)) {
  console.error('Locale / Langue / Idioma: fr, en, es');
  process.exitCode = 2;
} else if (
  !['demo', 'assess', 'scan-har'].includes(args[0]) ||
  (args[0] !== 'demo' && !args[1]) ||
  (args[0] === 'scan-har' && !args[2])
) {
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
      args[0] === 'scan-har'
        ? scanHarForCanaries(input, { ...JSON.parse(await readFile(args[2], 'utf8')), locale })
        : assessAgeProof(input, { locale });
    const output = JSON.stringify(report, null, 2);
    const outputPath = args[0] === 'scan-har' ? args[3] : args[2];
    if (outputPath) await writeFile(outputPath, output, { flag: 'wx', mode: 0o600 });
    else console.log(output);
  } catch {
    console.error(failure[locale]);
    process.exitCode = 2;
  }
}
