#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { replayBill } from '../src/index.js';

const locale = process.argv.find((arg) => arg.startsWith('--locale='))?.slice(9) ?? 'fr';
const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--locale='));
const usage = {
  fr: 'Usage : bill-replay demo | analyze entree.json [rapport.json] [--locale=fr|en|es]',
  en: 'Usage: bill-replay demo | analyze input.json [report.json] [--locale=fr|en|es]',
  es: 'Uso: bill-replay demo | analyze entrada.json [informe.json] [--locale=fr|en|es]',
};
const failure = {
  fr: 'Rapprochement impossible : vérifiez les données locales.',
  en: 'Replay failed: check the local data.',
  es: 'No se pudo conciliar: comprueba los datos locales.',
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
    const report = replayBill(JSON.parse(await readFile(path, 'utf8')), { locale });
    const output = JSON.stringify(report, null, 2);
    if (args[0] === 'analyze' && args[2])
      await writeFile(args[2], output, { flag: 'wx', mode: 0o600 });
    else console.log(output);
  } catch {
    console.error(failure[locale]);
    process.exitCode = 2;
  }
}
