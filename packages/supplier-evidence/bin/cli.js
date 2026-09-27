#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareSupplierResponse } from '../src/index.js';

const usage = {
  fr: 'Usage : supplier-evidence demo | prepare inventaire.json demande.json [nouvelle-reponse.json] [--locale=fr|en|es]',
  en: 'Usage: supplier-evidence demo | prepare inventory.json request.json [new-response.json] [--locale=fr|en|es]',
  es: 'Uso: supplier-evidence demo | prepare inventario.json solicitud.json [respuesta-nueva.json] [--locale=fr|en|es]',
};
const failure = {
  fr: 'Préparation impossible : vérifiez les fichiers d’entrée et leurs chemins.',
  en: 'Preparation failed: check the input files and their paths.',
  es: 'No se pudo preparar: comprueba los archivos de entrada y sus rutas.',
};
const args = process.argv.slice(2);
const locale = args.find((arg) => arg.startsWith('--locale='))?.slice(9) ?? 'fr';
const [command, inventoryPath, requestPath, outputPath] = args.filter(
  (arg) => !arg.startsWith('--locale='),
);
if (!Object.hasOwn(usage, locale)) {
  console.error('Locale / Langue / Idioma: fr, en, es');
  process.exitCode = 2;
} else {
  try {
    if (command !== 'demo' && (command !== 'prepare' || !inventoryPath || !requestPath)) {
      console.log(usage[locale]);
      if (command) process.exitCode = 2;
    } else {
      const sample = fileURLToPath(new URL('../fixtures/', import.meta.url));
      const source = command === 'demo' ? sample + 'inventory.json' : inventoryPath;
      const inventory = JSON.parse(await readFile(source, 'utf8'));
      const requests = JSON.parse(
        await readFile(command === 'demo' ? sample + 'requests.json' : requestPath, 'utf8'),
      );
      const options = {
        baseDir: dirname(source),
        locale,
        asOf: command === 'demo' ? '2026-09-27T00:00:00Z' : new Date().toISOString(),
      };
      const response = Array.isArray(requests)
        ? await Promise.all(
            requests.map((request) => prepareSupplierResponse(inventory, request, options)),
          )
        : await prepareSupplierResponse(inventory, requests, options);
      const json = JSON.stringify(response, null, 2);
      if (outputPath && command === 'prepare')
        await writeFile(outputPath, json, { flag: 'wx', mode: 0o600 });
      else console.log(json);
    }
  } catch {
    console.error(failure[locale]);
    process.exitCode = 2;
  }
}
