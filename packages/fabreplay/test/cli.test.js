import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const exec = promisify(execFile),
  cli = new URL('../bin/cli.js', import.meta.url).pathname;
test('CLI runs in each language, hashes evidence and never overwrites exports', async () => {
  for (const locale of ['fr', 'en', 'es']) {
    const r = JSON.parse(
      (await exec(process.execPath, [cli, 'demo', '--locale=' + locale])).stdout,
    );
    assert.equal(r.locale, locale);
    assert.match(r.evidence[0].sha256, /^[a-f0-9]{64}$/);
  }
  const dir = await mkdtemp(join(tmpdir(), 'atomic-cli-'));
  try {
    const file = join(dir, 'report.json');
    await exec(process.execPath, [cli, 'demo', '--output=' + file]);
    const original = await readFile(file, 'utf8');
    await assert.rejects(
      exec(process.execPath, [cli, 'demo', '--output=' + file]),
      (e) => e.code === 2,
    );
    assert.equal(await readFile(file, 'utf8'), original);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
  await assert.rejects(exec(process.execPath, [cli, 'demo', '--locale=de']), (e) => e.code === 2);
  await assert.rejects(exec(process.execPath, [cli, 'demo', '--unknown=1']), (e) => e.code === 2);
});
test('check returns distinct acceptance and inconclusive exit codes', async () => {
  await assert.rejects(
    exec(process.execPath, [
      cli,
      'check',
      new URL('../fixtures/demo.json', import.meta.url).pathname,
    ]),
    (e) => e.code === 1,
  );
  const dir = await mkdtemp(join(tmpdir(), 'fab-check-'));
  try {
    const x = JSON.parse(await readFile(new URL('../fixtures/demo.json', import.meta.url), 'utf8'));
    x.minimumStiffnessNPerM = 17.5;
    const file = join(dir, 'input.json');
    const { writeFile } = await import('node:fs/promises');
    await writeFile(file, JSON.stringify(x));
    await assert.rejects(exec(process.execPath, [cli, 'check', file]), (e) => e.code === 3);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
