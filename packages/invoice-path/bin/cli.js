#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { analyzeInvoicePath } from '../src/index.js';

const usage = {
  fr: 'Usage : invoice-path demo | analyze entree.json [rapport.json] [--locale=fr|en|es]',
  en: 'Usage: invoice-path demo | analyze input.json [report.json] [--locale=fr|en|es]',
  es: 'Uso: invoice-path demo | analyze entrada.json [informe.json] [--locale=fr|en|es]',
};
const failure = {
  fr: 'Analyse impossible : vérifiez les factures et les événements.',
  en: 'Analysis failed: check invoices and events.',
  es: 'No se pudo analizar: comprueba las facturas y los eventos.',
};
const args = process.argv.slice(2);
const locale = args.find((arg) => arg.startsWith('--locale='))?.slice(9) ?? 'fr';
const [command, inputPath, outputPath] = args.filter((arg) => !arg.startsWith('--locale='));
if (!Object.hasOwn(usage, locale)) {
  console.error('Locale / Langue / Idioma: fr, en, es');
  process.exitCode = 2;
} else if (!['demo', 'analyze'].includes(command) || (command === 'analyze' && !inputPath)) {
  console.log(usage[locale]);
  if (command) process.exitCode = 2;
} else {
  try {
    const file =
      command === 'demo'
        ? fileURLToPath(new URL('../fixtures/sample.json', import.meta.url))
        : inputPath;
    const report = analyzeInvoicePath(JSON.parse(await readFile(file, 'utf8')), { locale });
    const json = JSON.stringify(report, null, 2);
    if (outputPath && command === 'analyze')
      await writeFile(outputPath, json, { flag: 'wx', mode: 0o600 });
    else console.log(json);
  } catch {
    console.error(failure[locale]);
    process.exitCode = 2;
  }
}
