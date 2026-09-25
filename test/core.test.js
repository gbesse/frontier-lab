import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { World, defaultSeed, diff, runScenario, fingerprint } from '@gbesse/branch-lab';
import { learn, validate, execute, recordDemo } from '@gbesse/teachpack';
import { compileVisualSkill, matchVisualStep } from '@gbesse/teachpack/visual';
import { migrate, generate, parseCSV, defaultMapping } from '@gbesse/exit-workflow';
import { runJourney } from '@gbesse/agent-checkout-lab';
import { demonstrations, heldOut, exitSource } from '../studio/fixtures.js';
import { createStudio } from '../studio/server.js';
const input = { customerId: 'c-alice', sku: 'lamp', quantity: 2 };
const adapter = (world) => ({ simulation: true, execute: world.execute.bind(world) });

test('Branch successful workflow changes stock, credit, order and simulated outbox', () => {
  const w = new World();
  const before = w.snapshot();
  recordDemo(w, input);
  assert.equal(w.state.products[0].stock, 28);
  assert.equal(w.state.customers[0].exposureCents, 9000);
  assert.equal(w.state.orders[0].status, 'confirmed');
  assert.equal(w.state.outbox[0].simulation, true);
  assert.equal(w.events.length, 4);
  assert.ok(diff(before, w.state).length >= 4);
});
test('Branch failed operations are atomic and keep matching before/after fingerprints', () => {
  const w = new World();
  const { orderId } = w.execute('create_order', input);
  const before = w.snapshot();
  assert.throws(() => w.execute('confirm_order', { orderId }), { code: 'INVALID_TRANSITION' });
  assert.deepEqual(w.snapshot(), before);
  assert.equal(w.events.at(-1).before, w.events.at(-1).after);
});
test('Branch stock and credit are enforced, including rechecking credit at confirmation', () => {
  const seed = defaultSeed();
  seed.products[0].stock = 1;
  const w = new World(seed);
  const { orderId } = w.execute('create_order', input);
  assert.throws(() => w.execute('reserve_order', { orderId }), { code: 'OUT_OF_STOCK' });
  assert.equal(w.state.products[0].stock, 1);
  const other = defaultSeed();
  other.customers[0].creditLimitCents = 10000;
  const v = new World(other);
  const a = v.execute('create_order', input),
    b = v.execute('create_order', input);
  v.execute('reserve_order', { orderId: a.orderId });
  v.execute('reserve_order', { orderId: b.orderId });
  v.execute('confirm_order', { orderId: a.orderId });
  assert.throws(() => v.execute('confirm_order', { orderId: b.orderId }), { code: 'CREDIT_LIMIT' });
});
test('Branch forks are isolated and cancellation returns reserved stock', () => {
  const w = new World();
  const { orderId } = w.execute('create_order', input);
  const fork = w.fork();
  fork.execute('reserve_order', { orderId });
  assert.equal(w.state.products[0].stock, 30);
  assert.equal(fork.state.products[0].stock, 28);
  fork.execute('cancel_order', { orderId });
  assert.equal(fork.state.products[0].stock, 30);
  assert.equal(w.state.orders[0].status, 'draft');
});
test('Branch idempotency deduplicates and rejects conflicting reuse', () => {
  const w = new World(),
    options = { idempotencyKey: 'same' };
  const a = w.execute('create_order', input, options);
  assert.deepEqual(w.execute('create_order', input, options), a);
  assert.equal(w.state.orders.length, 1);
  assert.throws(() => w.execute('create_order', { ...input, quantity: 3 }, options), {
    code: 'IDEMPOTENCY_CONFLICT',
  });
});
test('Branch injected failure is retryable without partial business effects', () => {
  const w = new World(undefined, { faults: { create_order: 1 } });
  const before = w.snapshot();
  assert.throws(() => w.execute('create_order', input), { code: 'INJECTED_FAILURE' });
  assert.deepEqual(w.snapshot(), before);
  assert.equal(w.execute('create_order', input).orderId, 'o-1');
});
test('Branch rejects unsafe quantity, duplicate seed, unknown tools and extra arguments', () => {
  const w = new World();
  for (const quantity of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER])
    assert.throws(() => w.execute('create_order', { ...input, quantity }));
  assert.throws(() => w.execute('create_order', { ...input, unexpected: true }), {
    code: 'INVALID_INPUT',
  });
  assert.throws(() => w.execute('delete_all', {}), { code: 'UNKNOWN_TOOL' });
  const seed = defaultSeed();
  seed.customers.push(seed.customers[0]);
  assert.throws(() => new World(seed), { code: 'INVALID_SEED' });
});
test('Branch scenarios require actual assertions and do not mask unexpected errors', () => {
  assert.equal(runScenario({ steps: [] }).passed, false);
  assert.equal(
    runScenario({ steps: [{ tool: 'missing', args: {} }], expected: { outboxCount: 0 } }).passed,
    false,
  );
  assert.equal(
    runScenario({
      steps: [{ tool: 'missing', args: {} }],
      expected: { errorCode: 'UNKNOWN_TOOL', outboxCount: 0 },
    }).passed,
    true,
  );
  assert.throws(() => runScenario({ steps: [], expected: { nonsense: 0 } }), {
    code: 'INVALID_EXPECTATION',
  });
  assert.equal(fingerprint({ b: 2, a: 1 }), fingerprint({ a: 1, b: 2 }));
});
test('Teachpack learns input and result bindings and passes an unseen case with shifted IDs', async () => {
  const skill = learn(demonstrations());
  assert.equal(validate(skill).valid, true);
  assert.deepEqual(skill.steps[0].args.quantity, { kind: 'input', name: 'quantity' });
  assert.deepEqual(skill.steps[1].args.orderId, { kind: 'result', step: 0, field: 'orderId' });
  const w = new World();
  w.execute('create_order', input);
  const r = await execute(skill, heldOut, adapter(w), {
    allow: skill.permissions,
    runId: 'unseen',
  });
  assert.equal(r.ok, true);
  assert.equal(r.steps[0].result.orderId, 'o-2');
  assert.equal(w.state.outbox[0].to, 'delta@example.test');
});
test('Teachpack replay of the same logical run has no duplicate effects', async () => {
  const skill = learn(demonstrations()),
    w = new World(),
    options = { allow: skill.permissions, runId: 'unique' };
  await execute(skill, heldOut, adapter(w), options);
  const before = w.snapshot();
  assert.equal((await execute(skill, heldOut, adapter(w), options)).ok, true);
  assert.deepEqual(w.snapshot(), before);
});
test('Teachpack permissions and live execution require explicit authorization', async () => {
  const skill = learn(demonstrations()),
    w = new World();
  await assert.rejects(() => execute(skill, heldOut, adapter(w)), { code: 'PERMISSION_DENIED' });
  await assert.rejects(
    () => execute(skill, heldOut, { execute: w.execute.bind(w) }, { allow: skill.permissions }),
    { code: 'LIVE_NOT_AUTHORIZED' },
  );
  await assert.rejects(
    () => execute(skill, { ...heldOut, extra: 1 }, adapter(w), { allow: skill.permissions }),
    { code: 'INVALID_INPUT' },
  );
  assert.equal(w.events.length, 0);
});
test('Teachpack stops on a tool failure without pretending to roll back prior steps', async () => {
  const skill = learn(demonstrations()),
    w = new World(undefined, { faults: { queue_email: 1 } });
  const r = await execute(skill, heldOut, adapter(w), { allow: skill.permissions });
  assert.equal(r.ok, false);
  assert.equal(r.stoppedAt, 3);
  assert.equal(w.state.orders[0].status, 'confirmed');
  assert.equal(w.state.outbox.length, 0);
});
test('Teachpack rejects insufficient, divergent and ambiguous demonstrations', () => {
  assert.throws(() => learn([demonstrations()[0]]), { code: 'NEED_DEMONSTRATIONS' });
  const ds = demonstrations();
  ds[1].steps.pop();
  assert.throws(() => learn(ds), { code: 'DIVERGENT_TRACE' });
  const same = demonstrations();
  same[1] = structuredClone(same[0]);
  assert.throws(() => learn(same.slice(0, 2)), { code: 'AMBIGUOUS_CONSTANT' });
  const ambiguous = demonstrations();
  for (const d of ambiguous) d.inputs.other = d.inputs.quantity;
  assert.throws(() => learn(ambiguous), { code: 'AMBIGUOUS_BINDING' });
});
test('Teachpack refuses forward references and undeclared permissions', () => {
  const s = learn(demonstrations());
  s.steps[1].args.orderId.step = 2;
  assert.throws(() => validate(s), { code: 'INVALID_SKILL' });
  const t = learn(demonstrations());
  t.permissions = [];
  assert.throws(() => validate(t), { code: 'INVALID_SKILL' });
});
test('Teachpack visual guide derives checkpoints from changing screen text and supports review', () => {
  const frames = [
    {
      index: 0,
      atMs: 0,
      ocr: [
        { text: 'Clients', confidence: 0.99 },
        { text: 'Créer', confidence: 0.98 },
      ],
    },
    {
      index: 1,
      atMs: 2200,
      clicks: [{ atMs: 1400, button: 'left', x: 0.42, y: 0.31 }],
      ocr: [
        { text: 'Clients', confidence: 0.99 },
        { text: 'Commande enregistrée', confidence: 0.99 },
      ],
    },
    {
      index: 2,
      atMs: 4400,
      ocr: [
        { text: 'Clients', confidence: 0.99 },
        { text: 'Facture préparée', confidence: 0.99 },
      ],
    },
  ];
  const guide = compileVisualSkill(frames, {
    title: 'Commande',
    selected: [0, 2],
    labels: { 2: 'Préparer la facture' },
  });
  assert.equal(guide.kind, 'visual-guide');
  assert.equal(guide.steps.length, 2);
  assert.equal(guide.steps[1].instruction, 'Préparer la facture');
  assert.deepEqual(guide.steps[1].interactions, [{ atMs: 1400, button: 'left', x: 0.42, y: 0.31 }]);
  assert.deepEqual(guide.steps[1].appeared, ['Facture préparée']);
  assert.equal(matchVisualStep(guide.steps[1], frames[2].ocr).matched, true);
  assert.equal(matchVisualStep(guide.steps[1], frames[0].ocr).matched, false);
  const english = compileVisualSkill(frames, { locale: 'en' });
  const spanish = compileVisualSkill(frames, { locale: 'es' });
  assert.equal(english.steps[0].instruction, 'Starting screen');
  assert.equal(spanish.steps[0].instruction, 'Pantalla inicial');
  assert.equal(english.steps[0].instructionTranslations.es, 'Pantalla inicial');
  assert.equal(spanish.locale, 'es');
  assert.throws(() => compileVisualSkill(frames, { locale: 'de' }), { code: 'INVALID_LOCALE' });
  assert.throws(() => compileVisualSkill(frames, { selected: [2, 0] }), {
    code: 'INVALID_SELECTION',
  });
});
test('Exit preserves relations, attachments and hashes', () => {
  const { data, report } = migrate(exitSource);
  assert.equal(report.ok, true);
  assert.equal(report.unmapped.length, 0);
  assert.deepEqual(report.counts, { customers: 2, tickets: 3, attachments: 1 });
  const a = data.attachments[0];
  assert.equal(
    a.sha256,
    createHash('sha256').update(Buffer.from(a.contentBase64, 'base64')).digest('hex'),
  );
  assert.equal(a.ticketId, 'i-103');
  assert.equal(data.tickets[0].customerId, 'c-1');
});
test('Exit reports orphan relations, invalid status, duplicate IDs and malformed attachments', () => {
  const source = structuredClone(exitSource);
  source.tickets[0].customerId = 'missing';
  source.tickets[1].status = 'unknown';
  source.customers.push(source.customers[0]);
  source.attachments[0].contentBase64 = '!!';
  const { report } = migrate(source);
  assert.equal(report.ok, false);
  for (const code of ['ORPHAN_TICKET', 'UNMAPPED_STATUS', 'DUPLICATE_ID', 'INVALID_BASE64'])
    assert.ok(
      report.errors.some((e) => e.code === code),
      code,
    );
});
test('Exit CSV parses quoted commas, line breaks, escaped quotes and BOM; malformed inputs fail', () => {
  assert.deepEqual(parseCSV('\uFEFFid,notes\r\n1,"hello, ""world""\nnext"\r\n'), [
    { id: '1', notes: 'hello, "world"\nnext' },
  ]);
  for (const source of ['id,id\n1,2', 'id,n\n1', 'id\n"oops', 'id\n"a"b', '__proto__\na'])
    assert.throws(() => parseCSV(source), { code: 'INVALID_CSV' });
});
test('Exit accepts zero-byte attachments without losing their identity', () => {
  const source = structuredClone(exitSource);
  source.attachments[0].contentBase64 = '';
  const { data, report } = migrate(source);
  assert.equal(report.ok, true);
  assert.equal(data.attachments[0].bytes, 0);
  assert.equal(data.attachments[0].id, 'a-1');
});
test('Exit mappings can rename fields and normalize statuses', () => {
  const source = {
    customers: [{ key: '1', company: 'A' }],
    tickets: [{ key: 't', client: '1', label: 'Work', state: 'todo' }],
  };
  const mapping = {
    customers: { id: 'key', name: 'company' },
    tickets: { id: 'key', customerId: 'client', title: 'label', status: 'state' },
    statuses: { todo: 'open' },
  };
  const { data, report } = migrate(source, mapping);
  assert.equal(report.ok, true);
  assert.equal(data.tickets[0].status, 'open');
  assert.equal(data.tickets[0].notes, '');
});
test('Exit requires loss acceptance, retains originals, never overwrites, and hashes generated files', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'exit-test-')),
    source = structuredClone(exitSource);
  source.customers[0].legacyScore = 12;
  await assert.rejects(() => generate(source, defaultMapping, join(parent, 'blocked')), {
    code: 'UNACCEPTED_LOSS',
  });
  const result = await generate(source, defaultMapping, join(parent, 'owned'), {
    acceptLoss: true,
  });
  assert.deepEqual(
    JSON.parse(await readFile(join(result.directory, 'source.json'), 'utf8')),
    source,
  );
  for (const [name, hash] of Object.entries(result.manifest.files))
    assert.equal(
      createHash('sha256')
        .update(await readFile(join(result.directory, name)))
        .digest('hex'),
      hash,
    );
  assert.equal((await stat(join(result.directory, 'data.json'))).mode & 0o777, 0o600);
  await assert.rejects(
    () => generate(source, defaultMapping, result.directory, { acceptLoss: true }),
    { code: 'EEXIST' },
  );
});
test('Checkout validates task and requires explicit submission permission before opening a browser', async () => {
  await assert.rejects(() => runJourney({ url: 'http://127.0.0.1:1' }), {
    code: 'SUBMISSION_NOT_AUTHORIZED',
  });
  await assert.rejects(() => runJourney({ url: 'http://127.0.0.1:1', task: {} }), {
    code: 'INVALID_TASK',
  });
});
test('Studio protects writes, records demos, validates all scenarios and restores persisted state', async () => {
  const storageDir = await mkdtemp(join(tmpdir(), 'studio-test-'));
  let studio = await createStudio({ port: 0, storageDir });
  let url = await studio.listen();
  try {
    let state = await (await fetch(url + '/api/state')).json();
    assert.equal((await fetch(url + '/api/teach/examples', { method: 'POST' })).status, 403);
    const post = async (path, data = {}) => {
      const r = await fetch(url + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-studio-token': state.token },
        body: JSON.stringify(data),
      });
      assert.equal(r.status, 200, await r.clone().text());
      return r.json();
    };
    await post('/api/teach/record/start', { inputs: input });
    for (const tool of ['create_order', 'reserve_order', 'confirm_order', 'queue_email'])
      await post('/api/teach/record/step', { tool });
    await post('/api/teach/examples');
    await post('/api/teach/learn');
    for (const variant of ['normal', 'stock', 'credit', 'failure', 'duplicate'])
      assert.equal((await post('/api/branch/run', { variant })).scenarioPassed, true, variant);
    const exported = await post('/api/exit/generate');
    assert.equal((await fetch(url + exported.download)).status, 200);
    await studio.close();
    studio = await createStudio({ port: 0, storageDir });
    url = await studio.listen();
    state = await (await fetch(url + '/api/state')).json();
    assert.equal(state.demos.length, 3);
    assert.equal(state.branchReports.length, 5);
    assert.equal(state.exports.length, 1);
    assert.equal(state.skill.steps.length, 4);
  } finally {
    await studio.close();
  }
});
