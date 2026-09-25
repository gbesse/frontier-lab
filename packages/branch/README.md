# Branch

An inspectable business simulator for rehearsing agent actions. Local alpha, MIT, Node.js 22+. Package name: `@gbesse/branch-lab` (not yet published).

## Run from this workspace

After `npm ci` at the repository root:

```sh
npx branch-lab seed
npx branch-lab run scenario.json
```

Example `scenario.json`:

```json
{
  "steps": [
    { "tool": "create_order", "args": { "customerId": "c-alice", "sku": "lamp", "quantity": 2 } },
    { "tool": "reserve_order", "args": { "orderId": "o-1" } },
    { "tool": "confirm_order", "args": { "orderId": "o-1" } },
    { "tool": "queue_email", "args": { "orderId": "o-1" } }
  ],
  "expected": { "errorCode": null, "confirmedOrders": 1, "outboxCount": 1 }
}
```

## API

```js
import { World, defaultSeed, diff } from '@gbesse/branch-lab';
const original = new World(defaultSeed());
const branch = original.fork({ faults: { queue_email: 1 } });
const before = branch.snapshot();
const { orderId } = branch.execute(
  'create_order',
  {
    customerId: 'c-alice',
    sku: 'lamp',
    quantity: 2,
  },
  { idempotencyKey: 'checkout-42:create' },
);
branch.execute('reserve_order', { orderId });
console.log(diff(before, branch.snapshot()));
```

Exports: `World`, `DomainError`, `defaultSeed`, `tools` (tool descriptions and JSON schemas), `diff`, `runScenario`, `canonical`, `fingerprint`.

Rules: draft → reserved → confirmed. Cancellation of draft/reserved orders releases stock. Confirmation rechecks credit and consumes exposure. `queue_email` only creates a simulated outbox entry and refuses duplicate notification. Each successful operation commits atomically; failed operations retain identical before/after state hashes. **A multi-step workflow is not an atomic transaction**: an email failure does not undo a confirmed order.

Idempotency keys deduplicate a successful operation; changing its arguments with the same key is rejected. Keys and state are in memory, copied by `fork`, not a distributed ledger. Replays return the original result without adding a new business event. Scenario `passed` requires at least one explicit supported assertion and rejects unexpected errors.

## Boundaries

Only the declared commerce model is simulated. No real email, payments, ERP calls, automatic production snapshot or network interception. Do not execute arbitrary untrusted code inside the simulator and assume isolation. State/events are inspectable JavaScript objects, not tamper-proof audit records. Use integer cents. Event logs may contain input data; redact before sharing.
