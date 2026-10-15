#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { runScenario, defaultSeed, recordScenario, replayScenario } from '../src/index.js';
try {
  const [command, file, out] = process.argv.slice(2);
  if (command === 'seed') console.log(JSON.stringify(defaultSeed(), null, 2));
  else if (['record', 'replay'].includes(command) && file) {
    const input = JSON.parse(await readFile(file, 'utf8'));
    const result = command === 'record' ? recordScenario(input) : replayScenario(input);
    const json = JSON.stringify(result, null, 2);
    if (out) await writeFile(out, json, { flag: 'wx', mode: 0o600 });
    else console.log(json);
    if (command === 'replay' && !result.verified) process.exitCode = 1;
  } else if (command === 'run' && file) {
    const result = runScenario(JSON.parse(await readFile(file, 'utf8')));
    const json = JSON.stringify(result, null, 2);
    if (out) await writeFile(out, json, { flag: 'wx', mode: 0o600 });
    else console.log(json);
    if (!result.passed) process.exitCode = 1;
  } else {
    console.log(
      'branch-lab seed\nbranch-lab run scenario.json [new-report.json]\nbranch-lab record scenario.json [new-bundle.json]\nbranch-lab replay bundle.json [new-verification.json]',
    );
    if (command) process.exitCode = 2;
  }
} catch (e) {
  console.error(`${e.code ?? 'ERROR'}: ${e.message}`);
  process.exitCode = 2;
}
