import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStudio } from '../studio/server.js';

test('click monitoring needs explicit opt-in and full-display sharing; denial preserves visual recording', async () => {
  const storageDir = await mkdtemp(join(tmpdir(), 'teach-clicks-'));
  let attempted = 0;
  const studio = await createStudio({
    storageDir,
    port: 0,
    visualRecognizer: async () => [],
    clickMonitorFactory: async () => {
      attempted++;
      return { enabled: false, reason: 'permission' };
    },
  });
  const url = await studio.listen();
  try {
    const { token } = await (await fetch(url + '/api/state')).json();
    const post = async (path, body) => {
      const response = await fetch(url + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-studio-token': token },
        body: JSON.stringify(body),
      });
      assert.equal(response.status, 200);
      return response.json();
    };
    const defaultSession = await post('/api/teach/visual/start', {});
    assert.deepEqual(defaultSession.clickCapture, { enabled: false, reason: 'not-requested' });
    await post('/api/teach/visual/stop', { id: defaultSession.id });
    const windowSession = await post('/api/teach/visual/start', {
      captureClicks: true,
      displaySurface: 'window',
    });
    assert.deepEqual(windowSession.clickCapture, {
      enabled: false,
      reason: 'full-screen-required',
    });
    await post('/api/teach/visual/stop', { id: windowSession.id });
    assert.equal(attempted, 0);
    const deniedSession = await post('/api/teach/visual/start', {
      captureClicks: true,
      displaySurface: 'monitor',
    });
    assert.deepEqual(deniedSession.clickCapture, { enabled: false, reason: 'permission' });
    assert.equal(attempted, 1);
    const recording = await post('/api/teach/visual/stop', { id: deniedSession.id });
    assert.deepEqual(recording.clicks, []);
    assert.deepEqual(recording.frames, []);
  } finally {
    await studio.close();
  }
});
