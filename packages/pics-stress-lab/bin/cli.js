#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { runPicsExercise } from '../src/index.js';

const locale = process.argv.find((arg) => arg.startsWith('--locale='))?.slice(9) ?? 'fr';
const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--locale='));
const usage = {
  fr: 'Usage : pics-stress-lab demo | analyze entree.json [rapport.json] [--locale=fr|en|es]',
  en: 'Usage: pics-stress-lab demo | analyze input.json [report.json] [--locale=fr|en|es]',
  es: 'Uso: pics-stress-lab demo | analyze entrada.json [informe.json] [--locale=fr|en|es]',
};
const failure = {
  fr: 'Exercice impossible : vérifiez les données et le chemin de sortie.',
  en: 'Exercise failed: check the input data and output path.',
  es: 'No se pudo ejecutar el ejercicio: comprueba los datos y la ruta de salida.',
};
if (!Object.hasOwn(usage, locale)) {
  console.error('Locale / Langue / Idioma: fr, en, es');
  process.exitCode = 2;
} else if (!['demo', 'analyze'].includes(args[0]) || (args[0] === 'analyze' && !args[1])) {
  console.log(usage[locale]);
  if (args[0]) process.exitCode = 2;
} else {
  try {
    const path =
      args[0] === 'demo'
        ? fileURLToPath(new URL('../fixtures/sample.json', import.meta.url))
        : args[1];
    const report = runPicsExercise(JSON.parse(await readFile(path, 'utf8')), { locale });
    const json = JSON.stringify(report, null, 2);
    if (args[0] === 'analyze' && args[2])
      await writeFile(args[2], json, { flag: 'wx', mode: 0o600 });
    else console.log(json);
  } catch {
    console.error(failure[locale]);
    process.exitCode = 2;
  }
}
