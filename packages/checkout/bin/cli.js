#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { runJourney } from '../src/index.js';
try {
  const [cmd, url, file, ...flags] = process.argv.slice(2);
  if (cmd !== 'run' || !url || !file) {
    console.log(
      'agent-checkout-lab run URL task.json --allow-submit [--driver semantic|structured|model] [--out DIR]',
    );
    if (cmd) process.exitCode = 2;
  } else {
    const option = (k) => {
      const i = flags.indexOf(k);
      return i < 0 ? undefined : flags[i + 1];
    };
    const report = await runJourney({
      url,
      task: JSON.parse(await readFile(file, 'utf8')),
      allowSubmit: flags.includes('--allow-submit'),
      driver: option('--driver') ?? 'semantic',
      outputDir: option('--out'),
    });
    console.log(JSON.stringify(report, null, 2));
    if (!report.passed) process.exitCode = 1;
  }
} catch (e) {
  console.error(`${e.code ?? 'ERROR'}: ${e.message}`);
  process.exitCode = 2;
}
