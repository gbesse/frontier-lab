#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { migrate, generate, defaultMapping, parseCSV } from '../src/index.js';
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
try {
  const [cmd, file, directory, ...flags] = process.argv.slice(2);
  let result;
  if (cmd === 'inspect' && file) {
    result = migrate(await read(file), directory ? await read(directory) : defaultMapping).report;
    if (!result.ok) process.exitCode = 1;
  } else if (cmd === 'generate' && file && directory) {
    const i = flags.indexOf('--mapping');
    result = await generate(
      await read(file),
      i >= 0 ? await read(flags[i + 1]) : defaultMapping,
      directory,
      { acceptLoss: flags.includes('--accept-loss') },
    );
  } else if (cmd === 'csv' && file) result = parseCSV(await readFile(file, 'utf8'));
  else {
    console.log(
      'exit-workflow inspect source.json [mapping.json]\nexit-workflow generate source.json NEW_DIRECTORY [--mapping mapping.json] [--accept-loss]\nexit-workflow csv input.csv',
    );
    if (cmd) process.exitCode = 2;
  }
  if (result) console.log(JSON.stringify(result, null, 2));
} catch (e) {
  console.error(`${e.code ?? 'ERROR'}: ${e.message}`);
  process.exitCode = 2;
}
