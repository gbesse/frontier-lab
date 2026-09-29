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
for (const name of [
  'branch',
  'teachpack',
  'exit',
  'checkout',
  'machine-data',
  'supplier-evidence',
  'handover-drill',
  'payee-exceptions',
  'invoice-path',
  'provenance-last-mile',
  'pqc-cutover',
]) {
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
const machine = JSON.parse((await run('machine-data-lab', ['demo', '--locale=en'])).stdout);
assert.equal(machine.records.length, 6);
const supplier = JSON.parse((await run('supplier-evidence', ['demo', '--locale=es'])).stdout);
assert.equal(supplier[0].released.length, 2);
assert.equal(supplier[1].unresolved[0].code, 'withheld');
const handover = JSON.parse((await run('handover-drill', ['demo', '--locale=fr'])).stdout);
assert.equal(handover.passed, true);
const payee = JSON.parse((await run('payee-exceptions', ['demo', '--locale=fr'])).stdout);
assert.equal(payee.cases.filter((item) => item.decision === 'review').length, 2);
const invoice = JSON.parse((await run('invoice-path', ['demo', '--locale=en'])).stdout);
assert.ok(invoice.issues.some((item) => item.code === 'wrongRoute'));
const provenance = JSON.parse((await run('provenance-last-mile', ['demo', '--locale=es'])).stdout);
assert.equal(provenance.stages.at(-1).code, 'absent');
const pqc = JSON.parse((await run('pqc-cutover', ['demo', '--locale=en'])).stdout);
assert.ok(pqc.systems[1].findings.some((item) => item.code === 'downgradeObserved'));
console.log(`All eleven packages installed and CLIs executed outside the monorepo: ${consumer}`);
