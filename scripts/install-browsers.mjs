import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const candidates = [
  root,
  ...(await readdir(resolve(root, 'packages'), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(root, 'packages', entry.name)),
];
const versions = new Map();
for (const directory of candidates) {
  try {
    const path = createRequire(resolve(directory, 'package.json')).resolve(
      'playwright/package.json',
    );
    const { version } = JSON.parse(await readFile(path, 'utf8'));
    versions.set(version, resolve(dirname(path), 'cli.js'));
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
  }
}
if (!versions.size)
  throw new Error(
    'FR : lancer npm ci avant cette commande. EN: run npm ci before this command. ES: ejecutar npm ci antes de este comando.',
  );
let first = true;
for (const [version, cli] of versions) {
  console.log(
    `FR : installation de Chromium pour Playwright ${version}. EN: installing Chromium for Playwright ${version}. ES: instalación de Chromium para Playwright ${version}.`,
  );
  const args = [
    cli,
    'install',
    ...(first && process.argv.includes('--with-deps') ? ['--with-deps'] : []),
    'chromium',
  ];
  await new Promise((done, reject) => {
    const child = spawn(process.execPath, args, { stdio: 'inherit' });
    child.once('error', reject);
    child.once('close', (code) =>
      code === 0
        ? done()
        : reject(
            new Error(
              `FR : installation du navigateur échouée (${code}). EN: browser installation failed (${code}). ES: instalación del navegador fallida (${code}).`,
            ),
          ),
    );
  });
  first = false;
}
