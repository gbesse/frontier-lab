import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
import { demonstrations, heldOut, exitSource } from '../studio/fixtures.js';
const exec = promisify(execFile),
  temp = await mkdtemp(join(tmpdir(), 'frontier-pack-')),
  tarballs = [];
for (const name of ['branch', 'teachpack', 'exit', 'checkout']) {
  const { stdout } = await exec('npm', ['pack', '--json', '--pack-destination', temp], {
    cwd: resolve('packages', name),
  });
  const [info] = JSON.parse(stdout);
  for (const required of [
    'README.md',
    'LICENSE',
    'src/index.js',
    'bin/cli.js',
    ...(name === 'teachpack' ? ['src/visual.js'] : []),
  ])
    assert.ok(
      info.files.some((f) => f.path === required),
      `${name}: missing ${required}`,
    );
  assert.ok(
    !info.files.some((f) => /\.env|node_modules|\.local|output\//.test(f.path)),
    'Private artifact in package',
  );
  tarballs.push(join(temp, info.filename));
  console.log(`Packed ${info.name}: ${info.files.length} files`);
}
const consumer = join(temp, 'consumer');
await mkdir(consumer);
await writeFile(
  join(consumer, 'package.json'),
  JSON.stringify({ name: 'external-consumer', private: true, type: 'module' }),
);
await exec('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', ...tarballs], {
  cwd: consumer,
  timeout: 120000,
});
for (const [name, value] of Object.entries({
  'demonstrations.json': demonstrations(),
  'inputs.json': heldOut,
  'source.json': exitSource,
}))
  await writeFile(join(consumer, name), JSON.stringify(value));
const run = async (bin, args = []) =>
  exec(process.execPath, [join(consumer, 'node_modules/.bin', bin), ...args], {
    cwd: consumer,
    timeout: 20000,
  });
await run('branch-lab', ['seed']);
await run('teachpack', ['learn', 'demonstrations.json', 'skill.json']);
await run('teachpack', ['validate', 'skill.json']);
const rehearsal = JSON.parse(
  (await run('teachpack', ['rehearse', 'skill.json', 'inputs.json'])).stdout,
);
assert.equal(rehearsal.ok, true);
await run('exit-workflow', ['inspect', 'source.json']);
await run('exit-workflow', ['generate', 'source.json', 'owned']);
await run('agent-checkout-lab');
console.log(`All four packages installed and CLIs executed outside the monorepo: ${consumer}`);
