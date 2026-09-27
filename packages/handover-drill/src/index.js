import { spawn } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, realpath, rm, stat } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const locales = ['fr', 'en', 'es'];
const copy = {
  invalid: ['Configuration invalide.', 'Invalid configuration.', 'Configuración no válida.'],
  failed: [
    'Exercice interrompu à l’étape {stage}.',
    'Drill stopped at stage {stage}.',
    'El ejercicio se detuvo en la etapa {stage}.',
  ],
  passed: [
    'Copie propre, installation éventuelle, restauration, démarrage et contrôle métier réussis.',
    'Clean copy, optional installation, restore, startup and business check passed.',
    'La copia limpia, la instalación opcional, la restauración, el arranque y la comprobación de negocio se completaron.',
  ],
  notice: [
    'Exécuter seulement du code de confiance. Cet exercice local ne prouve pas une reprise en production.',
    'Run trusted code only. This local drill does not prove production recoverability.',
    'Ejecuta solo código de confianza. Este ejercicio local no demuestra la recuperación en producción.',
  ],
};
const message = (key, locale, params = {}) =>
  copy[key][locales.indexOf(locale)].replace(/\{(\w+)\}/g, (_, name) => params[name]);
const object = (value) => value && typeof value === 'object' && !Array.isArray(value);
const inside = (root, path) => {
  const part = relative(root, path);
  return part === '' || (part !== '..' && !part.startsWith(`..${sep}`) && !isAbsolute(part));
};
const command = (value) =>
  Array.isArray(value) && value.length > 0 && value.every((arg) => typeof arg === 'string' && arg);
const safePath = (value) =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function start(argv, cwd, port) {
  return spawn(argv[0], argv.slice(1), {
    cwd,
    env: {
      PATH: process.env.PATH ?? '',
      NODE_ENV: 'test',
      PORT: String(port),
      HOST: '127.0.0.1',
      ...(process.platform === 'win32' ? { SystemRoot: process.env.SystemRoot } : {}),
    },
    stdio: 'ignore',
  });
}

async function runOnce(argv, cwd, port, timeoutMs) {
  const child = start(argv, cwd, port);
  return await new Promise((resolve) => {
    let done = false;
    let timedOut = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(ok && !timedOut);
    };
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
      setTimeout(() => finish(false), 1000).unref();
    }, timeoutMs);
    child.once('error', () => finish(false));
    child.once('exit', (code) => finish(code === 0));
  });
}

async function stopChild(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const ended = new Promise((resolve) => child.once('exit', resolve));
  child.kill('SIGTERM');
  await Promise.race([ended, delay(1000)]);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGKILL');
    await Promise.race([ended, delay(1000)]);
  }
}

async function getJson(port, path, timeoutMs) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw Error(`HTTP ${response.status}`);
  return response.json();
}

export async function runHandoverDrill(config, { baseDir = process.cwd(), locale = 'fr' } = {}) {
  if (!locales.includes(locale)) throw Error('Locale must be fr, en or es');
  if (
    !object(config) ||
    typeof config.source !== 'string' ||
    !Array.isArray(config.files) ||
    !config.files.length ||
    config.files.length > 100 ||
    (config.install !== undefined && !command(config.install)) ||
    !command(config.restore) ||
    !command(config.start) ||
    !safePath(config.healthPath) ||
    !safePath(config.businessPath) ||
    !object(config.expectedBusiness)
  )
    throw Error(message('invalid', locale));
  const timeoutMs = Math.min(Math.max(config.timeoutMs ?? 10000, 1000), 30000);
  if (!Number.isSafeInteger(timeoutMs)) throw Error(message('invalid', locale));
  let root, source;
  try {
    root = await realpath(baseDir);
    source = await realpath(resolve(root, config.source));
  } catch {
    throw Error(message('invalid', locale));
  }
  if (!inside(root, source)) throw Error(message('invalid', locale));
  const workspace = await mkdtemp(join(tmpdir(), 'handover-drill-'));
  const stages = [];
  let child;
  let stage = 'copy';
  let totalBytes = 0;
  try {
    for (const file of config.files) {
      if (typeof file !== 'string' || !file || isAbsolute(file))
        throw Error(message('invalid', locale));
      if (/^\.env(?:\.|$)|\.(?:pem|p12|pfx|key)$/i.test(basename(file)))
        throw Error(message('invalid', locale));
      const input = await realpath(resolve(source, file));
      if (!inside(source, input) || !(await stat(input)).isFile())
        throw Error(message('invalid', locale));
      const size = (await stat(input)).size;
      totalBytes += size;
      if (size > 5_000_000 || totalBytes > 25_000_000) throw Error(message('invalid', locale));
      const output = resolve(workspace, file);
      if (!inside(workspace, output) || output === workspace)
        throw Error(message('invalid', locale));
      await mkdir(dirname(output), { recursive: true });
      await copyFile(input, output);
    }
    stages.push({ stage, passed: true });
    const port = await freePort();
    if (config.install) {
      stage = 'install';
      if (!(await runOnce(config.install, workspace, port, timeoutMs))) throw Error('install');
      stages.push({ stage, passed: true });
    }
    stage = 'restore';
    if (!(await runOnce(config.restore, workspace, port, timeoutMs))) throw Error('restore');
    stages.push({ stage, passed: true });
    stage = 'start';
    child = start(config.start, workspace, port);
    let exited = false;
    child.once('error', () => (exited = true));
    child.once('exit', () => (exited = true));
    const deadline = Date.now() + timeoutMs;
    let healthy = false;
    while (Date.now() < deadline && !exited) {
      try {
        const health = await getJson(port, config.healthPath, 500);
        if (health.ok === true) {
          healthy = true;
          break;
        }
      } catch {}
      await delay(100);
    }
    if (!healthy) throw Error('health');
    stages.push({ stage, passed: true });
    stage = 'business';
    const actual = await getJson(port, config.businessPath, timeoutMs);
    if (!isDeepStrictEqual(actual, config.expectedBusiness)) throw Error('business');
    stages.push({ stage, passed: true });
    return {
      schemaVersion: 1,
      locale,
      passed: true,
      notice: message('notice', locale),
      summary: message('passed', locale),
      stages,
    };
  } catch {
    stages.push({ stage, passed: false, reasonCode: `${stage.toUpperCase()}_FAILED` });
    return {
      schemaVersion: 1,
      locale,
      passed: false,
      notice: message('notice', locale),
      summary: message('failed', locale, { stage }),
      stages,
    };
  } finally {
    await stopChild(child);
    await rm(workspace, { recursive: true, force: true });
  }
}
