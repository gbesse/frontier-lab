import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, copyFile, readdir, chmod } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const exec = promisify(execFile),
  root = fileURLToPath(new URL('../', import.meta.url)),
  runtime = resolve(root, '.local/space-runtime'),
  engine = resolve(root, 'packages/space-mission-lab/engines');
const locale = ['fr', 'en', 'es'].includes(process.env.SPACE_LOCALE)
    ? process.env.SPACE_LOCALE
    : 'fr',
  index = { fr: 0, en: 1, es: 2 }[locale];
const say = (...rows) => console.log(rows[index]);
async function command(file, args, options = {}) {
  return exec(file, args, { maxBuffer: 8 * 1024 * 1024, timeout: 1800000, ...options });
}
async function hash(path) {
  return createHash('sha256')
    .update(await readFile(path))
    .digest('hex');
}
async function download(item) {
  const path = resolve(runtime, item.file);
  await mkdir(dirname(path), { recursive: true });
  if (existsSync(path) && (await hash(path)) === item.sha256) return path;
  const temporary = path + '.download';
  await command('curl', ['-fsSL', '--retry', '2', '--max-time', '900', item.url, '-o', temporary]);
  if ((await hash(temporary)) !== item.sha256) throw new Error('SHA256_MISMATCH: ' + item.file);
  await copyFile(temporary, path);
  return path;
}
async function unpack(archive, directory) {
  await mkdir(directory, { recursive: true });
  const { stdout } = await command('tar', ['-tzf', archive]);
  if (stdout.split('\n').some((p) => p.startsWith('/') || p.split('/').includes('..')))
    throw new Error('ARCHIVE_PATH');
  await command('tar', ['-xzf', archive, '-C', directory]);
  return join(
    directory,
    (await readdir(directory)).find((p) => !p.startsWith('.')),
  );
}
try {
  await mkdir(runtime, { recursive: true, mode: 0o700 });
  say(
    'Installation des moteurs dans .local/space-runtime…',
    'Installing engines in .local/space-runtime…',
    'Instalando motores en .local/space-runtime…',
  );
  const python = process.env.SPACE_PYTHON || 'python3';
  const { stdout: pythonVersion } = await command(python, [
    '-c',
    'import sys; assert (3,11)<=sys.version_info[:2]<=(3,13); print(sys.version.split()[0])',
  ]);
  if (!existsSync(join(runtime, 'venv/bin/python')))
    await command(python, ['-m', 'venv', join(runtime, 'venv')]);
  await command(join(runtime, 'venv/bin/python'), [
    '-m',
    'pip',
    'install',
    '-r',
    join(engine, 'requirements.txt'),
    '-c',
    join(engine, 'requirements.lock.txt'),
  ]);
  const tools = JSON.parse(await readFile(join(engine, 'toolchain.json'), 'utf8')).artifacts;
  for (const item of tools.filter((x) => x.file.startsWith('jars/'))) await download(item);
  let java = process.env.SPACE_JAVA || 'java',
    javac = process.env.SPACE_JAVAC || 'javac';
  if (process.platform === 'darwin' && process.arch === 'arm64' && !process.env.SPACE_JAVA) {
    const archive = await download(tools.find((x) => x.file === 'jdk.tar.gz'));
    const destination = join(runtime, 'jdk');
    const home = existsSync(destination)
      ? join(
          destination,
          (await readdir(destination)).find((x) => !x.startsWith('.')),
        )
      : await unpack(archive, destination);
    java = join(home, 'Contents/Home/bin/java');
    javac = join(home, 'Contents/Home/bin/javac');
  }
  const javaVersion = await command(java, ['-version']);
  if (!/version "(?:1[7-9]|[2-9]\d)[.]/.test(javaVersion.stderr))
    throw new Error('JAVA_17_REQUIRED');
  await mkdir(join(runtime, 'classes'), { recursive: true });
  await command(javac, [
    '-cp',
    join(runtime, 'jars/*'),
    '-d',
    join(runtime, 'classes'),
    join(engine, 'OrekitAdapter.java'),
  ]);
  await writeFile(
    join(runtime, 'runtime.json'),
    JSON.stringify(
      {
        schemaVersion: 1,
        java,
        orekitVersion: '13.1.9',
        ionVersion: '4.2.0',
        pythonVersion: pythonVersion.trim(),
      },
      null,
      2,
    ),
  );
  const manifest = JSON.parse(await readFile(join(engine, 'datasets.json'), 'utf8'));
  for (const data of manifest.datasets) {
    if (data.fixture) {
      const path = join(runtime, data.file);
      await mkdir(dirname(path), { recursive: true });
      await copyFile(join(root, 'packages/space-mission-lab/fixtures', data.fixture), path);
      if ((await hash(path)) !== data.sha256) throw new Error('DATASET_INTEGRITY');
    } else await download(data);
  }
  if (!existsSync(join(runtime, 'ion/bin/bpsendfile'))) {
    const tar = await download(tools.find((x) => x.file === 'ion.tar.gz')),
      source = await unpack(tar, join(runtime, 'ion-source'));
    const automakeTar = await download(tools.find((x) => x.file === 'automake.tar.gz')),
      automakeSource = await unpack(automakeTar, join(runtime, 'automake-source')),
      prefix = join(runtime, 'autotools');
    if (!existsSync(join(prefix, 'bin/automake'))) {
      await command(join(automakeSource, 'configure'), ['--prefix=' + prefix], {
        cwd: automakeSource,
      });
      await command('make', ['-j4'], { cwd: automakeSource });
      await command('make', ['install'], { cwd: automakeSource });
    }
    const macro = await download(tools.find((x) => x.file === 'pkg.m4'));
    await mkdir(join(source, 'm4'), { recursive: true });
    await copyFile(macro, join(source, 'm4/pkg.m4'));
    const env = {
      ...process.env,
      AUTOMAKE: join(prefix, 'bin/automake'),
      ACLOCAL: join(prefix, 'bin/aclocal'),
    };
    await command('autoreconf', ['-fi'], { cwd: source, env });
    await command(
      join(source, 'configure'),
      ['--prefix=' + join(runtime, 'ion'), '--disable-dgr', '--disable-sysctl-check'],
      { cwd: source, env },
    );
    await command('make', ['-j4'], { cwd: source, env });
    await command('make', ['install'], { cwd: source, env });
  }
  await chmod(runtime, 0o700);
  say(
    'Moteurs et données prêts. Lance npm run space:test:engines.',
    'Engines and data ready. Run npm run space:test:engines.',
    'Motores y datos listos. Ejecuta npm run space:test:engines.',
  );
} catch (error) {
  say(
    'Installation interrompue. Aucun résultat de secours simulé. Vérifier Python, Java et les outils de compilation.',
    'Setup interrupted. No simulated fallback. Check Python, Java and build tools.',
    'Instalación interrumpida. Sin sustitución simulada. Revisa Python, Java y herramientas de compilación.',
  );
  console.error(error.message);
  process.exitCode = 1;
}
