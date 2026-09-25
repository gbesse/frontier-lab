#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { World } from '@gbesse/branch-lab';
import { learn, validate, execute } from '../src/index.js';
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
try {
  const [cmd, file, next, out] = process.argv.slice(2);
  let result;
  if (cmd === 'learn' && file) {
    result = learn(await read(file));
    if (next) {
      await writeFile(next, JSON.stringify(result, null, 2), { flag: 'wx', mode: 0o600 });
      result = { written: next };
    }
  } else if (cmd === 'validate' && file) result = validate(await read(file));
  else if (cmd === 'rehearse' && file && next) {
    const skill = await read(file),
      world = new World();
    result = await execute(
      skill,
      await read(next),
      { simulation: true, execute: world.execute.bind(world) },
      { allow: skill.permissions, runId: 'cli' },
    );
    result.state = world.snapshot();
    if (!result.ok) process.exitCode = 1;
    if (out) await writeFile(out, JSON.stringify(result, null, 2), { flag: 'wx', mode: 0o600 });
  } else {
    console.log(
      'teachpack learn demonstrations.json [new-skill.json]\nteachpack validate skill.json\nteachpack rehearse skill.json inputs.json [new-report.json]',
    );
    if (cmd) process.exitCode = 2;
  }
  if (result) console.log(JSON.stringify(result, null, 2));
} catch (e) {
  console.error(`${e.code ?? 'ERROR'}: ${e.message}`);
  process.exitCode = 2;
}
