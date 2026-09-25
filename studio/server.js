import http from 'node:http';
import { readFileSync, writeFileSync, renameSync, existsSync, createReadStream } from 'node:fs';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { World, defaultSeed, diff, tools as worldTools } from '@gbesse/branch-lab';
import { learn, execute } from '@gbesse/teachpack';
import { compileVisualSkill } from '@gbesse/teachpack/visual';
import { migrate, generate, defaultMapping } from '@gbesse/exit-workflow';
import { runJourney, defaultTask } from '@gbesse/agent-checkout-lab';
import { demonstrations, heldOut, exitSource } from './fixtures.js';
import { createVisualRecognizer } from './visual-recognizer.js';
import { createClickMonitor } from './click-monitor.js';
const root = dirname(fileURLToPath(import.meta.url));
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
export async function createStudio({
  storageDir = resolve(root, '../.local'),
  port = 4317,
  visualRecognizer,
  clickMonitorFactory,
} = {}) {
  await mkdir(storageDir, { recursive: true, mode: 0o700 });
  const stateFile = join(storageDir, 'studio.json');
  const state = existsSync(stateFile)
    ? JSON.parse(readFileSync(stateFile, 'utf8'))
    : {
        schemaVersion: 1,
        demos: [],
        skill: null,
        teachRuns: [],
        branchReports: [],
        checkoutReports: [],
        exports: [],
      };
  if (state.schemaVersion !== 1) throw Error('Unsupported studio state');
  state.visualRecordings ??= [];
  state.visualSkills ??= [];
  const token = randomBytes(24).toString('hex'),
    quotes = new Map();
  const recognize = visualRecognizer ?? createVisualRecognizer(storageDir);
  const startClickMonitor = clickMonitorFactory ?? createClickMonitor(storageDir);
  let recording = null,
    checkoutBusy = false,
    visualSession = null;
  const save = () => {
    writeFileSync(stateFile + '.tmp', JSON.stringify(state, null, 2), { mode: 0o600 });
    renameSync(stateFile + '.tmp', stateFile);
  };
  const remember = (key, value) => {
    state[key].unshift(value);
    state[key] = state[key].slice(0, 50);
    save();
    return value;
  };
  const server = http.createServer(async (req, res) => {
    const json = (status, value) => {
      res.writeHead(status, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(JSON.stringify(value));
    };
    try {
      const livePort = server.address().port,
        origin = `http://127.0.0.1:${livePort}`;
      if (![`127.0.0.1:${livePort}`, `localhost:${livePort}`].includes(req.headers.host))
        fail(403, 'Invalid Host');
      const url = new URL(req.url, origin),
        path = url.pathname;
      if (req.method === 'GET') {
        if (path === '/health') return json(200, { ok: true });
        if (path === '/api/state')
          return json(200, {
            ...state,
            seed: defaultSeed(),
            exitSource,
            defaultMapping,
            heldOut,
            defaultTask,
            token,
            storageDir,
            recording: recording ? { inputs: recording.inputs, steps: recording.steps } : null,
            visualSession: visualSession
              ? { id: visualSession.id, frames: visualSession.frames }
              : null,
          });
        if (path === '/api/teach/visual/image') {
          if (url.searchParams.get('token') !== token) fail(403, 'Missing image token');
          const id = url.searchParams.get('id'),
            frame = Number(url.searchParams.get('frame'));
          const source =
            visualSession?.id === id
              ? visualSession
              : state.visualRecordings.find((r) => r.id === id);
          if (
            !source ||
            !Number.isSafeInteger(frame) ||
            !source.frames.some((f) => f.index === frame)
          )
            fail(404, 'Unknown screen');
          res.writeHead(200, {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
          });
          createReadStream(join(storageDir, 'teach-visual', id, `${frame}.jpg`))
            .on('error', () => res.destroy())
            .pipe(res);
          return;
        }
        if (path.startsWith('/api/quote/')) {
          const quote = quotes.get(decodeURIComponent(path.slice(11)));
          return json(quote ? 200 : 404, quote ?? { error: 'Quote not found' });
        }
        if (path === '/api/download') {
          const item = state.exports.find((e) => e.id === url.searchParams.get('id'));
          if (!item) fail(404, 'Unknown export');
          res.writeHead(200, {
            'Content-Type': 'application/gzip',
            'Content-Disposition': `attachment; filename="exit-${item.id}.tar.gz"`,
          });
          createReadStream(join(storageDir, 'exports', item.id + '.tar.gz'))
            .on('error', () => res.destroy())
            .pipe(res);
          return;
        }
        const files = {
          '/': 'index.html',
          '/app.js': 'app.js',
          '/i18n.js': 'i18n.js',
          '/visual.js': 'visual.js',
          '/style.css': 'style.css',
          '/fixture/checkout': 'checkout.html',
        };
        if (!files[path]) fail(404, 'Not found');
        const name = files[path],
          type = name.endsWith('.js')
            ? 'text/javascript'
            : name.endsWith('.css')
              ? 'text/css'
              : 'text/html';
        res.writeHead(200, {
          'Content-Type': `${type}; charset=utf-8`,
          'Cache-Control': 'no-store',
          'Content-Security-Policy':
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",
          'X-Content-Type-Options': 'nosniff',
        });
        return res.end(readFileSync(join(root, name), 'utf8').replaceAll('__TOKEN__', token));
      }
      if (req.method !== 'POST') fail(405, 'Method not allowed');
      if (req.headers['x-studio-token'] !== token) fail(403, 'Missing studio token');
      if (
        req.headers.origin &&
        ![origin, `http://localhost:${livePort}`].includes(req.headers.origin)
      )
        fail(403, 'Invalid Origin');
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 8 * 1024 * 1024) fail(413, 'Request too large');
      }
      const input = JSON.parse(body || '{}');
      if (!input || typeof input !== 'object' || Array.isArray(input)) fail(400, 'Object required');
      if (path === '/api/teach/visual/start') {
        if (visualSession) fail(409, 'Une capture est déjà en cours');
        const id = randomUUID();
        await mkdir(join(storageDir, 'teach-visual', id), { recursive: true, mode: 0o700 });
        const session = {
          id,
          startedAt: Date.now(),
          frames: [],
          clicks: [],
          busy: false,
          clickCapture: { enabled: false, reason: 'not-requested' },
        };
        visualSession = session;
        session.timeout = setTimeout(
          () => {
            session.monitor?.stop();
            session.monitor = null;
            if (session.clickCapture.enabled)
              session.clickCapture = { enabled: false, reason: 'time-limit' };
          },
          15 * 60 * 1000,
        );
        session.timeout.unref();
        if (input.captureClicks === true) {
          if (input.displaySurface !== 'monitor')
            session.clickCapture = { enabled: false, reason: 'full-screen-required' };
          else {
            const monitor = await startClickMonitor((event) => {
              if (visualSession !== session) return;
              if (session.clicks.length >= 500) {
                session.monitor?.stop();
                session.clickCapture = { enabled: false, reason: 'limit' };
                return;
              }
              const atMs = Math.round(event.at - session.startedAt);
              if (atMs < 0 || atMs > 15 * 60 * 1000) return;
              session.clicks.push({
                atMs,
                button: event.button,
                x: Number(event.x.toFixed(4)),
                y: Number(event.y.toFixed(4)),
              });
            }).catch(() => ({ enabled: false, reason: 'start-failed' }));
            session.monitor = monitor.enabled ? monitor : null;
            session.clickCapture = {
              enabled: monitor.enabled,
              ...(monitor.enabled ? {} : { reason: monitor.reason }),
            };
          }
        }
        return json(200, { id, maxFrames: 120, clickCapture: session.clickCapture });
      }
      if (path === '/api/teach/visual/clicks') {
        if (!visualSession || input.id !== visualSession.id) fail(409, 'Capture non active');
        if (
          visualSession.monitor &&
          !visualSession.monitor.enabled &&
          visualSession.clickCapture.enabled
        )
          visualSession.clickCapture = { enabled: false, reason: 'tap-ended' };
        return json(200, {
          clickCapture: visualSession.clickCapture,
          clicks: visualSession.clicks,
        });
      }
      if (path === '/api/teach/visual/frame') {
        if (!visualSession || input.id !== visualSession.id) fail(409, 'Capture non active');
        if (visualSession.busy) fail(409, 'Analyse de l’image précédente en cours');
        if (
          visualSession.frames.length >= 120 ||
          Date.now() - visualSession.startedAt > 15 * 60 * 1000
        )
          fail(422, 'Limite de 120 images ou 15 minutes atteinte');
        if (
          typeof input.image !== 'string' ||
          !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(input.image)
        )
          fail(422, 'Image JPEG encodée en base64 requise');
        const bytes = Buffer.from(input.image.slice(input.image.indexOf(',') + 1), 'base64');
        if (
          bytes.length < 20 ||
          bytes.length > 700_000 ||
          bytes[0] !== 0xff ||
          bytes[1] !== 0xd8 ||
          bytes[2] !== 0xff
        )
          fail(422, 'Image JPEG invalide ou supérieure à 700 Ko');
        const session = visualSession,
          index = session.frames.length;
        const imagePath = join(storageDir, 'teach-visual', session.id, `${index}.jpg`);
        session.busy = true;
        try {
          await writeFile(imagePath, bytes, { flag: 'wx', mode: 0o600 });
          const ocr = await recognize(imagePath, input.locale ?? 'fr');
          const frame = {
            index,
            atMs: Date.now() - session.startedAt,
            locale: input.locale ?? 'fr',
            ocr,
          };
          session.frames.push(frame);
          return json(200, frame);
        } catch (error) {
          await unlink(imagePath).catch(() => {});
          throw error;
        } finally {
          session.busy = false;
        }
      }
      if (path === '/api/teach/visual/stop') {
        if (!visualSession || input.id !== visualSession.id) fail(409, 'Capture non active');
        if (visualSession.busy) fail(409, 'Attendre la fin de l’analyse');
        visualSession.monitor?.stop();
        clearTimeout(visualSession.timeout);
        let assigned = 0;
        for (const frame of visualSession.frames) {
          frame.clicks = visualSession.clicks
            .filter((click) => click.atMs <= frame.atMs)
            .slice(assigned);
          assigned += frame.clicks.length;
        }
        if (visualSession.frames.length && assigned < visualSession.clicks.length)
          visualSession.frames.at(-1).clicks.push(...visualSession.clicks.slice(assigned));
        const item = {
          id: visualSession.id,
          createdAt: new Date(visualSession.startedAt).toISOString(),
          frames: visualSession.frames,
          clicks: visualSession.clicks,
          clickCapture: visualSession.clickCapture,
        };
        visualSession = null;
        state.visualRecordings.unshift(item);
        state.visualRecordings = state.visualRecordings.slice(0, 50);
        save();
        return json(200, item);
      }
      if (path === '/api/teach/visual/compile') {
        const source = state.visualRecordings.find((r) => r.id === input.id);
        if (!source) fail(404, 'Capture inconnue');
        const skill = compileVisualSkill(source.frames, {
          title: input.title,
          selected: input.selected,
          labels: input.labels,
          locale: input.locale ?? 'fr',
          clickCapture: source.clickCapture,
        });
        const item = {
          id: randomUUID(),
          recordingId: source.id,
          createdAt: new Date().toISOString(),
          skill,
        };
        state.visualSkills.unshift(item);
        state.visualSkills = state.visualSkills.slice(0, 50);
        save();
        return json(200, item);
      }
      if (path === '/api/teach/visual/observe') {
        if (
          typeof input.image !== 'string' ||
          !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(input.image)
        )
          fail(422, 'Image JPEG requise');
        const bytes = Buffer.from(input.image.slice(input.image.indexOf(',') + 1), 'base64');
        if (
          bytes.length < 20 ||
          bytes.length > 700_000 ||
          bytes[0] !== 0xff ||
          bytes[1] !== 0xd8 ||
          bytes[2] !== 0xff
        )
          fail(422, 'Image JPEG invalide');
        const directory = join(storageDir, 'teach-visual', 'observations');
        await mkdir(directory, { recursive: true, mode: 0o700 });
        const imagePath = join(directory, `${randomUUID()}.jpg`);
        try {
          await writeFile(imagePath, bytes, { flag: 'wx', mode: 0o600 });
          return json(200, { ocr: await recognize(imagePath, input.locale ?? 'fr') });
        } finally {
          await unlink(imagePath).catch(() => {});
        }
      }
      if (path === '/api/teach/examples') {
        state.demos = demonstrations();
        state.skill = null;
        save();
        return json(200, { count: state.demos.length });
      }
      if (path === '/api/teach/record/start') {
        if (state.demos.length >= 100) fail(422, 'Maximum 100 demonstrations');
        if (
          !input.inputs ||
          Object.keys(input.inputs).sort().join(',') !== 'customerId,quantity,sku'
        )
          fail(422, 'Invalid input keys');
        recording = { inputs: input.inputs, world: new World(), steps: [] };
        return json(200, { started: true });
      }
      if (path === '/api/teach/record/step') {
        if (!recording) fail(409, 'Start recording first');
        const sequence = ['create_order', 'reserve_order', 'confirm_order', 'queue_email'];
        if (
          input.tool !== sequence[recording.steps.length] ||
          !worldTools.some((t) => t.name === input.tool)
        )
          fail(422, 'Follow the four-step sequence');
        const args =
          input.tool === 'create_order'
            ? recording.inputs
            : { orderId: recording.steps[0].result.orderId };
        const result = recording.world.execute(input.tool, args);
        recording.steps.push({ tool: input.tool, args, result, ok: true });
        if (input.tool === 'queue_email') {
          state.demos.push({ inputs: recording.inputs, steps: recording.steps });
          recording = null;
          state.skill = null;
          save();
        }
        return json(200, { result, complete: !recording });
      }
      if (path === '/api/teach/learn') {
        const demos = input.demos ?? state.demos;
        const skill = learn(demos);
        state.skill = skill;
        state.demos = demos;
        save();
        return json(200, skill);
      }
      if (path === '/api/teach/run' || path === '/api/branch/run') {
        const skill = state.skill ?? learn(demonstrations()),
          seed = defaultSeed(),
          variant = input.variant ?? 'normal',
          inputs = input.inputs ?? heldOut;
        if (!['normal', 'stock', 'credit', 'failure', 'duplicate'].includes(variant))
          fail(422, 'Unknown scenario');
        if (variant === 'stock') seed.products.forEach((p) => (p.stock = 0));
        if (variant === 'credit') seed.customers.forEach((c) => (c.creditLimitCents = 0));
        const world = new World(seed, { faults: variant === 'failure' ? { queue_email: 1 } : {} });
        if (variant !== 'credit')
          world.execute('create_order', { customerId: 'c-alice', sku: 'chair', quantity: 1 });
        const before = world.snapshot(),
          runId = randomUUID(),
          adapter = { simulation: true, execute: world.execute.bind(world) };
        const report = await execute(skill, inputs, adapter, { allow: skill.permissions, runId });
        if (variant === 'duplicate' && report.ok)
          await execute(skill, inputs, adapter, { allow: skill.permissions, runId });
        const expected = {
          stock: 'OUT_OF_STOCK',
          credit: 'CREDIT_LIMIT',
          failure: 'INJECTED_FAILURE',
        }[variant];
        const checks = expected
          ? [
              { name: 'Erreur attendue', passed: report.error?.code === expected },
              { name: 'Aucun email simulé', passed: world.state.outbox.length === 0 },
            ]
          : [
              {
                name: 'Une commande confirmée',
                passed:
                  world.state.orders.filter(
                    (o) =>
                      o.status === 'confirmed' &&
                      o.customerId === inputs.customerId &&
                      o.sku === inputs.sku &&
                      o.quantity === inputs.quantity,
                  ).length === 1,
              },
              { name: 'Un seul email simulé', passed: world.state.outbox.length === 1 },
            ];
        return json(
          200,
          remember(path.includes('/branch/') ? 'branchReports' : 'teachRuns', {
            ...report,
            id: runId,
            variant,
            before,
            state: world.snapshot(),
            events: world.events,
            changes: diff(before, world.state),
            checks,
            scenarioPassed: checks.every((c) => c.passed),
          }),
        );
      }
      if (path === '/api/exit/inspect')
        return json(200, migrate(input.source ?? exitSource, input.mapping ?? defaultMapping));
      if (path === '/api/exit/generate') {
        const id = randomUUID(),
          parent = join(storageDir, 'exports');
        await mkdir(parent, { recursive: true, mode: 0o700 });
        const result = await generate(
          input.source ?? exitSource,
          input.mapping ?? defaultMapping,
          join(parent, id),
          { acceptLoss: input.acceptLoss === true },
        );
        await promisify(execFile)('tar', ['-czf', join(parent, id + '.tar.gz'), '-C', parent, id], {
          timeout: 30000,
        });
        return json(
          200,
          remember('exports', {
            id,
            directory: result.directory,
            report: result.report,
            download: `/api/download?id=${id}`,
          }),
        );
      }
      if (path === '/api/checkout/run') {
        if (checkoutBusy) fail(409, 'Browser test already running');
        const mode = input.mode ?? 'before',
          driver = input.driver ?? 'semantic';
        if (!['before', 'after'].includes(mode) || !['semantic', 'structured'].includes(driver))
          fail(422, 'Unsupported demo configuration');
        checkoutBusy = true;
        try {
          const report = await runJourney({
            url: `${origin}/fixture/checkout?mode=${mode}`,
            driver,
            task: input.task ?? defaultTask,
            allowSubmit: true,
            timeoutMs: 2500,
            outputDir: join(storageDir, 'checkout'),
          });
          return json(200, remember('checkoutReports', { ...report, mode }));
        } finally {
          checkoutBusy = false;
        }
      }
      if (path === '/api/quote') {
        const { customerName, email, sku, quantity } = input;
        if (
          typeof customerName !== 'string' ||
          !customerName.trim() ||
          customerName.length > 200 ||
          typeof email !== 'string' ||
          email.length > 254 ||
          !email.includes('@') ||
          !['lamp', 'chair', 'desk'].includes(sku) ||
          !Number.isSafeInteger(quantity) ||
          quantity < 1 ||
          quantity > 1000
        )
          fail(422, 'Invalid quote');
        const quote = { id: randomUUID(), customerName, email, sku, quantity, simulation: true };
        quotes.set(quote.id, quote);
        if (quotes.size > 10000) quotes.delete(quotes.keys().next().value);
        return json(201, quote);
      }
      fail(404, 'Not found');
    } catch (e) {
      if (!res.headersSent)
        json(e.status ?? 422, { error: { code: e.code ?? 'REQUEST_ERROR', message: e.message } });
      else res.destroy();
    }
  });
  return {
    server,
    storageDir,
    listen: () =>
      new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', () =>
          resolve(`http://127.0.0.1:${server.address().port}`),
        );
      }),
    close: () =>
      new Promise((resolve) => {
        visualSession?.monitor?.stop();
        clearTimeout(visualSession?.timeout);
        server.closeAllConnections();
        server.close(resolve);
      }),
  };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const studio = await createStudio({ port: Number(process.env.PORT) || 4317 });
  console.log(`Frontier Lab: ${await studio.listen()}`);
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, async () => {
      await studio.close();
      process.exit(0);
    });
}
