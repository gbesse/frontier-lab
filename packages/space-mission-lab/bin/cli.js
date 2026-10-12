#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { runMission, runFrontier } from '../src/index.js';
import { say } from '../src/i18n.js';
const raw = process.argv.slice(2);
const option = (key, fallback) =>
  raw.find((arg) => arg.startsWith(`--${key}=`))?.slice(key.length + 3) ?? fallback;
const locale = option('locale', 'fr');
const args = raw.filter((arg) => !arg.startsWith('--'));
try {
  const allowed =
    args[0] === 'frontier'
      ? /^--(?:locale|destination|relay|outage|conflict|seed|signal)=/
      : /^--(?:locale|fault|policy)=/;
  if (raw.some((arg) => arg.startsWith('--') && !allowed.test(arg))) throw 0;
  if (
    !['demo', 'analyze', 'frontier'].includes(args[0]) ||
    (args[0] === 'analyze' && !args[1]) ||
    args.length > (args[0] === 'analyze' ? 3 : 1)
  ) {
    console.log(say('usage', locale));
    process.exitCode = args.length ? 2 : 0;
  } else {
    const mission = JSON.parse(
      await readFile(
        args[0] !== 'analyze' ? new URL('../fixtures/sample.json', import.meta.url) : args[1],
        'utf8',
      ),
    );
    const bool = (key, fallback) => {
      const value = option(key, fallback);
      if (!['0', '1'].includes(value)) throw 0;
      return value === '1';
    };
    const report =
      args[0] === 'frontier'
        ? runFrontier(mission, {
            locale,
            destination: option('destination', 'mars'),
            relayPolicy: option('relay', 'store-forward'),
            outage: bool('outage', '0'),
            doubleSpend: bool('conflict', '0'),
            seed: Number(option('seed', '20261010')),
            signalInjection: bool('signal', '1'),
          })
        : runMission(mission, {
            locale,
            policy: option('policy', 'guarded'),
            fault: { kind: option('fault', 'nominal'), start: 0 },
          });
    const output = JSON.stringify(report, null, 2);
    if (args[2]) await writeFile(args[2], output, { flag: 'wx', mode: 0o600 });
    else console.log(output);
  }
} catch {
  console.error(
    ['fr', 'en', 'es'].includes(locale)
      ? say('failure', locale)
      : 'Langue / Language / Idioma: fr, en, es',
  );
  process.exitCode = 2;
}
