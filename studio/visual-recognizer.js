import { existsSync } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

export function createVisualRecognizer(storageDir) {
  const binary = join(storageDir, 'bin', 'vision-ocr');
  const source = fileURLToPath(new URL('./vision-ocr.swift', import.meta.url));
  let ready;
  return async (imagePath, locale = 'fr') => {
    if (!['fr', 'en', 'es'].includes(locale))
      throw Object.assign(new Error('Locale must be fr, en or es'), { code: 'INVALID_LOCALE' });
    if (process.platform !== 'darwin')
      throw Object.assign(
        new Error('La lecture locale du texte à l’écran exige macOS dans cette version.'),
        {
          code: 'OCR_UNAVAILABLE',
        },
      );
    if (!ready)
      ready = (async () => {
        await mkdir(join(storageDir, 'bin'), { recursive: true, mode: 0o700 });
        const stale =
          !existsSync(binary) || (await stat(source)).mtimeMs > (await stat(binary)).mtimeMs;
        if (stale) await exec('swiftc', [source, '-o', binary], { timeout: 120000 });
      })();
    await ready;
    const { stdout } = await exec(binary, [imagePath, locale], {
      timeout: 20000,
      maxBuffer: 1024 * 1024,
    });
    const rows = JSON.parse(stdout);
    if (!Array.isArray(rows) || rows.some((r) => typeof r.text !== 'string'))
      throw Error('Résultat OCR invalide');
    return rows;
  };
}
