import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
const exec = promisify(execFile);
const localSpice = resolve('.local/ngspice/bin/ngspice');
const ngspice =
  process.env.SWITCHBENCH_NGSPICE || (existsSync(localSpice) ? localSpice : 'ngspice');
const python = process.env.MICROFABGYM_PYTHON || resolve('.local/space-runtime/venv/bin/python');
for (const [bin, args, env] of [
  [
    process.execPath,
    ['--test', 'packages/switchbench/test/model.test.js'],
    { ...process.env, SWITCHBENCH_NGSPICE: ngspice },
  ],
  [python, ['packages/microfabgym/python/smoke.py'], process.env],
]) {
  const result = await exec(bin, args, { env, timeout: 60000, maxBuffer: 2e6 });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
}
