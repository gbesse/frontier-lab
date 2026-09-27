#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runHandoverDrill } from '../src/index.js';

const usage = {
  fr: 'Usage : handover-drill demo | run config.json [nouveau-rapport.json] [--locale=fr|en|es]',
  en: 'Usage: handover-drill demo | run config.json [new-report.json] [--locale=fr|en|es]',
  es: 'Uso: handover-drill demo | run config.json [informe-nuevo.json] [--locale=fr|en|es]',
};
const failure = {
  fr: 'Exercice impossible : vérifiez la configuration et les fichiers source.',
  en: 'Drill failed to start: check the configuration and source files.',
  es: 'No se pudo iniciar el ejercicio: comprueba la configuración y los archivos fuente.',
};
const args = process.argv.slice(2);
const locale = args.find((arg) => arg.startsWith('--locale='))?.slice(9) ?? 'fr';
const [command, configPath, outputPath] = args.filter((arg) => !arg.startsWith('--locale='));
if (!Object.hasOwn(usage, locale)) {
  console.error('Locale / Langue / Idioma: fr, en, es');
  process.exitCode = 2;
} else {
  try {
    if (command !== 'demo' && (command !== 'run' || !configPath)) {
      console.log(usage[locale]);
      if (command) process.exitCode = 2;
    } else {
      const path =
        command === 'demo'
          ? fileURLToPath(new URL('../fixtures/demo-config.json', import.meta.url))
          : configPath;
      const config = JSON.parse(await readFile(path, 'utf8'));
      const report = await runHandoverDrill(config, {
        baseDir: command === 'demo' ? fileURLToPath(new URL('..', import.meta.url)) : dirname(path),
        locale,
      });
      const json = JSON.stringify(report, null, 2);
      if (outputPath && command === 'run')
        await writeFile(outputPath, json, { flag: 'wx', mode: 0o600 });
      else console.log(json);
      if (!report.passed) process.exitCode = 1;
    }
  } catch {
    console.error(failure[locale]);
    process.exitCode = 2;
  }
}
