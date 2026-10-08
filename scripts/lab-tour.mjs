import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const run = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const labs = [
  'machine-data',
  'supplier-evidence',
  'handover-drill',
  'payee-exceptions',
  'invoice-path',
  'provenance-last-mile',
  'pqc-cutover',
];
const copy = {
  fr: {
    continuity: 'Manifeste C2PA absent après publication dans la démonstration.',
    preserved: 'Manifeste C2PA conservé après publication dans la démonstration.',
    error: 'Le parcours de démonstration a échoué.',
    unknown: 'Atelier inconnu. Choisissez un des sept noms de projet.',
  },
  en: {
    continuity: 'C2PA manifest missing after publication in the demonstration.',
    preserved: 'C2PA manifest preserved after publication in the demonstration.',
    error: 'The demonstration tour failed.',
    unknown: 'Unknown lab. Choose one of the seven project names.',
  },
  es: {
    continuity: 'Falta el manifiesto C2PA tras la publicación en la demostración.',
    preserved: 'El manifiesto C2PA se conserva tras la publicación en la demostración.',
    error: 'Falló el recorrido de demostración.',
    unknown: 'Laboratorio desconocido. Elija uno de los siete nombres de proyecto.',
  },
};
const locale = process.argv.find((arg) => arg.startsWith('--locale='))?.slice(9) ?? 'fr';
const selectedProject = process.argv.find((arg) => arg.startsWith('--project='))?.slice(10);
if (!Object.hasOwn(copy, locale)) {
  console.error('Locale / Langue / Idioma: fr, en, es');
  process.exitCode = 2;
} else if (selectedProject && !labs.includes(selectedProject)) {
  console.error(copy[locale].unknown);
  process.exitCode = 2;
} else {
  try {
    const results = [];
    for (const project of selectedProject ? [selectedProject] : labs) {
      const { stdout } = await run(
        process.execPath,
        [resolve(root, `packages/${project}/bin/cli.js`), 'demo', `--locale=${locale}`],
        {
          cwd: root,
          timeout: 60000,
          maxBuffer: 2_000_000,
        },
      );
      const report = JSON.parse(stdout);
      const reports = Array.isArray(report) ? report : [report];
      if (!reports.every((item) => item.locale === locale)) throw Error('locale mismatch');
      results.push({
        project,
        summaries: reports.map(
          (item) =>
            item.summary ?? (item.continuity ? copy[locale].preserved : copy[locale].continuity),
        ),
        notices: reports.map((item) => item.notice),
      });
    }
    console.log(JSON.stringify({ locale, synthetic: true, labs: results }, null, 2));
  } catch {
    console.error(copy[locale].error);
    process.exitCode = 2;
  }
}
