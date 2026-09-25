import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { World, defaultSeed, diff } from '@gbesse/branch-lab';
import { learn, execute } from '@gbesse/teachpack';
import { generate, defaultMapping } from '@gbesse/exit-workflow';
import { demonstrations, heldOut, exitSource } from '../studio/fixtures.js';
const out = resolve('output', `demo-${Date.now()}`);
await mkdir(out, { recursive: true });
const skill = learn(demonstrations()),
  world = new World(defaultSeed());
world.execute('create_order', { customerId: 'c-alice', sku: 'chair', quantity: 1 });
const before = world.snapshot();
const rehearsal = await execute(
  skill,
  heldOut,
  { simulation: true, execute: world.execute.bind(world) },
  { allow: skill.permissions, runId: 'demo' },
);
if (!rehearsal.ok || world.state.outbox.length !== 1) throw Error('Demonstration failed');
for (const [name, value] of Object.entries({
  'demonstrations.json': demonstrations(),
  'skill.json': skill,
  'rehearsal.json': { ...rehearsal, state: world.snapshot(), changes: diff(before, world.state) },
}))
  await writeFile(join(out, name), JSON.stringify(value, null, 2), { mode: 0o600 });
await generate(exitSource, defaultMapping, join(out, 'owned-app'));
console.log(
  `Teachpack: ${skill.steps.length} learned steps; held-out case passed with ID ${rehearsal.steps[0].result.orderId}.`,
);
console.log(
  `Branch: ${world.state.orders.filter((o) => o.status === 'confirmed').length} confirmed order; ${world.state.outbox.length} simulated notification.`,
);
console.log(`Exit: standalone application generated. Artifacts: ${out}`);
console.log('Checkout: run npm run test:browser for real browser evidence.');
