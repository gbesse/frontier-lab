import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const publicFiles = new Set(
  execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'])
    .toString('utf8')
    .split('\0')
    .filter(Boolean),
);

test('public source excludes local data, build output and private planning notes', () => {
  for (const file of publicFiles) {
    assert.doesNotMatch(
      file,
      /(^|\/)(?:\.env(?:\.[^/]+)?|\.local|output|node_modules|test-results)(?:\/|$)|\.(?:pem|p12|pfx|tgz)$/i,
      file,
    );
    assert.ok(statSync(file).size < 2_000_000, `${file}: unexpectedly large public file`);
  }
  for (const file of [
    'BUILD-PLAN.md',
    'PILOTS.md',
    'PISTE-FE-MCP-2026-09-24.md',
    'PISTES-FRONTIERE-2026-09-24.md',
    'PROPOSITIONS-CONSERVEES.md',
  ])
    assert.equal(publicFiles.has(file), false, `${file} must stay local`);
});

test('FR/EN/ES public READMEs and their local links are present', () => {
  for (const file of ['README.md', 'README.en.md', 'README.es.md']) {
    assert.ok(publicFiles.has(file), `${file} missing`);
    const markdown = readFileSync(file, 'utf8');
    for (const [, target] of markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      if (/^(?:https?:|#)/.test(target)) continue;
      const resolved = resolve(target);
      const relative = resolved.slice(process.cwd().length + 1);
      assert.ok(publicFiles.has(relative), `${file}: broken or private link ${target}`);
    }
  }
});
