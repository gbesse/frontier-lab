#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { analyzeMachineData } from '../src/index.js';

const usage = {
  fr: 'Usage : machine-data-lab demo | analyze entree.json [nouveau-rapport.json] [--locale=fr|en|es]',
  en: 'Usage: machine-data-lab demo | analyze input.json [new-report.json] [--locale=fr|en|es]',
  es: 'Uso: machine-data-lab demo | analyze entrada.json [informe-nuevo.json] [--locale=fr|en|es]',
};
const failure = {
  fr: 'Analyse impossible : vérifiez le fichier, son format et le périmètre déclaré.',
  en: 'Analysis failed: check the file, its format and the declared access scope.',
  es: 'No se pudo analizar: comprueba el archivo, su formato y el alcance declarado.',
};
const args = process.argv.slice(2);
const localeArg = args.find((arg) => arg.startsWith('--locale='));
const locale = localeArg?.slice(9) ?? 'fr';
const positional = args.filter((arg) => !arg.startsWith('--locale='));
if (!Object.hasOwn(usage, locale)) {
  console.error('Locale / Langue / Idioma: fr, en, es');
  process.exitCode = 2;
} else {
  try {
    const [command, inputPath, outputPath] = positional;
    if (!['demo', 'analyze'].includes(command) || (command === 'analyze' && !inputPath)) {
      console.log(usage[locale]);
      if (command) process.exitCode = 2;
    } else {
      const path =
        command === 'demo'
          ? fileURLToPath(new URL('../fixtures/two-machines.json', import.meta.url))
          : inputPath;
      const input = JSON.parse(await readFile(path, 'utf8'));
      const report = analyzeMachineData(input, {
        locale,
        asOf: command === 'demo' ? '2026-09-27T00:00:00Z' : new Date().toISOString(),
      });
      const json = JSON.stringify(report, null, 2);
      if (outputPath && command === 'analyze')
        await writeFile(outputPath, json, { flag: 'wx', mode: 0o600 });
      else console.log(json);
    }
  } catch {
    console.error(failure[locale]);
    process.exitCode = 2;
  }
}
