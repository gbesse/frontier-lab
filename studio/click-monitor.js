import { existsSync } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

export function createClickMonitor(storageDir) {
  const binary = join(storageDir, 'bin', 'mouse-clicks');
  const source = fileURLToPath(new URL('./mouse-clicks.swift', import.meta.url));
  let ready;
  return async (onClick) => {
    if (process.platform !== 'darwin') return { enabled: false, reason: 'macos-only' };
    ready ??= (async () => {
      await mkdir(join(storageDir, 'bin'), { recursive: true, mode: 0o700 });
      const stale =
        !existsSync(binary) || (await stat(source)).mtimeMs > (await stat(binary)).mtimeMs;
      if (stale) await exec('swiftc', [source, '-o', binary], { timeout: 120000 });
    })();
    try {
      await ready;
    } catch {
      ready = null;
      return { enabled: false, reason: 'build-failed' };
    }
    const child = spawn(binary, [], { stdio: ['ignore', 'pipe', 'ignore'] });
    let buffer = '';
    let activeMonitor;
    const result = await new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(value);
      };
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        finish({ enabled: false, reason: 'timeout' });
      }, 15000);
      child.stdout.on('data', (chunk) => {
        buffer += chunk.toString('utf8');
        if (buffer.length > 65536) {
          child.kill('SIGTERM');
          return finish({ enabled: false, reason: 'invalid-output' });
        }
        let newline;
        while ((newline = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, newline);
          buffer = buffer.slice(newline + 1);
          let value;
          try {
            value = JSON.parse(line);
          } catch {
            continue;
          }
          if (value.type === 'ready') {
            activeMonitor = {
              enabled: true,
              stop: () => child.kill('SIGTERM'),
            };
            finish(activeMonitor);
          } else if (value.type === 'error') {
            child.kill('SIGTERM');
            finish({ enabled: false, reason: value.reason });
          } else if (
            settled &&
            value.type === 'click' &&
            ['left', 'right'].includes(value.button) &&
            [value.x, value.y, value.at].every(Number.isFinite) &&
            value.x >= 0 &&
            value.x <= 1 &&
            value.y >= 0 &&
            value.y <= 1
          ) {
            onClick(value);
          }
        }
      });
      child.once('error', () => finish({ enabled: false, reason: 'start-failed' }));
      child.once('exit', () => {
        if (activeMonitor) {
          activeMonitor.enabled = false;
          activeMonitor.reason = 'tap-ended';
        }
        finish({ enabled: false, reason: 'tap-unavailable' });
      });
    });
    return result;
  };
}
