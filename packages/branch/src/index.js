import { createHash } from 'node:crypto';

export class DomainError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}
const fail = (code, message) => {
  throw new DomainError(code, message);
};
const own = (obj, key) => Object.hasOwn(obj, key);
export const canonical = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(',')}}`;
  return JSON.stringify(value);
};
export const fingerprint = (value) => createHash('sha256').update(canonical(value)).digest('hex');
const text = (v, name) => {
  if (typeof v !== 'string' || !v.trim() || v.length > 1000)
    fail('INVALID_INPUT', `${name}: nonempty string required`);
  return v;
};
const integer = (v, name, min = 0) => {
  if (!Number.isSafeInteger(v) || v < min)
    fail('INVALID_INPUT', `${name}: safe integer >= ${min} required`);
  return v;
};
function exact(obj, fields) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj))
    fail('INVALID_INPUT', 'Arguments must be an object');
  for (const key of Object.keys(obj))
    if (!fields.includes(key)) fail('INVALID_INPUT', `Unknown argument: ${key}`);
}
export const tools = [
  {
    name: 'create_order',
    description: 'Create a draft order after checking customer credit. Prices are integer cents.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['customerId', 'sku', 'quantity'],
      properties: {
        customerId: { type: 'string' },
        sku: { type: 'string' },
        quantity: { type: 'integer', minimum: 1 },
      },
    },
  },
  {
    name: 'reserve_order',
    description: 'Reserve stock for a draft order, atomically.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['orderId'],
      properties: { orderId: { type: 'string' } },
    },
  },
  {
    name: 'confirm_order',
    description:
      'Confirm an order with reserved stock; recheck credit and consume credit exposure.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['orderId'],
      properties: { orderId: { type: 'string' } },
    },
  },
  {
    name: 'queue_email',
    description:
      'Queue a simulated confirmation to the confirmed order customer. Never sends real email.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['orderId'],
      properties: { orderId: { type: 'string' } },
    },
  },
  {
    name: 'cancel_order',
    description:
      'Cancel a draft or reserved order and release its reserved stock. Confirmed orders require a different process.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['orderId'],
      properties: { orderId: { type: 'string' } },
    },
  },
];

export function defaultSeed() {
  return {
    customers: [
      {
        id: 'c-alice',
        name: 'Atelier Alice',
        email: 'alice@example.test',
        creditLimitCents: 100000,
        exposureCents: 0,
      },
      {
        id: 'c-benoit',
        name: 'Benoît Studio',
        email: 'benoit@example.test',
        creditLimitCents: 100000,
        exposureCents: 0,
      },
      {
        id: 'c-clara',
        name: 'Clara Design',
        email: 'clara@example.test',
        creditLimitCents: 100000,
        exposureCents: 0,
      },
      {
        id: 'c-delta',
        name: 'Delta Atelier',
        email: 'delta@example.test',
        creditLimitCents: 100000,
        exposureCents: 0,
      },
    ],
    products: [
      { sku: 'lamp', name: 'Lampe atelier', stock: 30, priceCents: 4500 },
      { sku: 'chair', name: 'Chaise studio', stock: 20, priceCents: 8500 },
      { sku: 'desk', name: 'Bureau compact', stock: 10, priceCents: 12000 },
    ],
  };
}
function validateSeed(seed) {
  if (!seed || !Array.isArray(seed.customers) || !Array.isArray(seed.products))
    fail('INVALID_SEED', 'customers and products arrays required');
  for (const [rows, key] of [
    [seed.customers, 'id'],
    [seed.products, 'sku'],
  ]) {
    const seen = new Set();
    for (const row of rows) {
      const id = text(row[key], key);
      if (seen.has(id)) fail('INVALID_SEED', `Duplicate ${key}: ${id}`);
      seen.add(id);
    }
  }
  for (const c of seed.customers) {
    text(c.name, 'name');
    text(c.email, 'email');
    integer(c.creditLimitCents, 'creditLimitCents');
    integer(c.exposureCents, 'exposureCents');
  }
  for (const p of seed.products) {
    text(p.name, 'name');
    integer(p.stock, 'stock');
    integer(p.priceCents, 'priceCents', 1);
  }
}
export class World {
  constructor(seed = defaultSeed(), { faults = {} } = {}) {
    validateSeed(seed);
    this.state = {
      schemaVersion: 1,
      customers: structuredClone(seed.customers),
      products: structuredClone(seed.products),
      orders: [],
      outbox: [],
      revision: 0,
    };
    this.events = [];
    this.idempotency = new Map();
    this.faults = { ...faults };
    for (const [name, count] of Object.entries(this.faults)) {
      if (!tools.some((t) => t.name === name)) fail('INVALID_FAULT', name);
      integer(count, 'fault count');
    }
  }
  snapshot() {
    return structuredClone(this.state);
  }
  fork({ faults = {} } = {}) {
    const child = new World(
      { customers: this.state.customers, products: this.state.products },
      { faults },
    );
    child.state = this.snapshot();
    child.events = structuredClone(this.events);
    child.idempotency = new Map(structuredClone([...this.idempotency]));
    return child;
  }
  execute(name, args, { idempotencyKey } = {}) {
    const before = fingerprint(this.state);
    try {
      if (!tools.some((t) => t.name === name)) fail('UNKNOWN_TOOL', `Unsupported tool: ${name}`);
      const requestHash = fingerprint({ name, args });
      if (idempotencyKey !== undefined) {
        text(idempotencyKey, 'idempotencyKey');
        if (this.idempotency.has(idempotencyKey)) {
          const saved = this.idempotency.get(idempotencyKey);
          if (saved.requestHash !== requestHash)
            fail('IDEMPOTENCY_CONFLICT', 'Key already used with different arguments');
          return structuredClone(saved.result);
        }
      }
      if ((this.faults[name] ?? 0) > 0) {
        this.faults[name]--;
        fail('INJECTED_FAILURE', `Simulated ${name} failure; no business state changed`);
      }
      const draft = this.snapshot();
      const result = this.apply(draft, name, args);
      draft.revision++;
      this.state = draft;
      const event = {
        sequence: this.events.length + 1,
        tool: name,
        args: structuredClone(args),
        result: structuredClone(result),
        ok: true,
        before,
        after: fingerprint(this.state),
      };
      this.events.push(event);
      if (idempotencyKey !== undefined)
        this.idempotency.set(idempotencyKey, { requestHash, result: structuredClone(result) });
      return structuredClone(result);
    } catch (error) {
      this.events.push({
        sequence: this.events.length + 1,
        tool: name,
        args: structuredClone(args),
        ok: false,
        error: { code: error.code ?? 'ERROR', message: error.message },
        before,
        after: fingerprint(this.state),
      });
      throw error;
    }
  }
  apply(s, name, args) {
    if (name === 'create_order') {
      exact(args, ['customerId', 'sku', 'quantity']);
      text(args.customerId, 'customerId');
      text(args.sku, 'sku');
      integer(args.quantity, 'quantity', 1);
      const customer = s.customers.find((c) => c.id === args.customerId),
        product = s.products.find((p) => p.sku === args.sku);
      if (!customer) fail('CUSTOMER_NOT_FOUND', args.customerId);
      if (!product) fail('PRODUCT_NOT_FOUND', args.sku);
      const totalCents = product.priceCents * args.quantity;
      integer(totalCents, 'totalCents');
      if (customer.exposureCents + totalCents > customer.creditLimitCents)
        fail('CREDIT_LIMIT', 'Customer credit limit would be exceeded');
      const order = {
        id: `o-${s.orders.length + 1}`,
        customerId: customer.id,
        sku: product.sku,
        quantity: args.quantity,
        totalCents,
        status: 'draft',
      };
      s.orders.push(order);
      return { orderId: order.id, totalCents, status: order.status };
    }
    exact(args, ['orderId']);
    text(args.orderId, 'orderId');
    const order = s.orders.find((o) => o.id === args.orderId);
    if (!order) fail('ORDER_NOT_FOUND', args.orderId);
    const product = s.products.find((p) => p.sku === order.sku),
      customer = s.customers.find((c) => c.id === order.customerId);
    if (name === 'reserve_order') {
      if (order.status !== 'draft')
        fail('INVALID_TRANSITION', 'Only draft orders may reserve stock');
      if (product.stock < order.quantity)
        fail('OUT_OF_STOCK', `Available ${product.stock}, requested ${order.quantity}`);
      product.stock -= order.quantity;
      order.status = 'reserved';
    } else if (name === 'confirm_order') {
      if (order.status !== 'reserved')
        fail('INVALID_TRANSITION', 'Reserve stock before confirmation');
      if (customer.exposureCents + order.totalCents > customer.creditLimitCents)
        fail('CREDIT_LIMIT', 'Credit changed before confirmation');
      customer.exposureCents += order.totalCents;
      order.status = 'confirmed';
    } else if (name === 'queue_email') {
      if (order.status !== 'confirmed')
        fail('INVALID_TRANSITION', 'Only confirmed orders may notify the customer');
      if (s.outbox.some((m) => m.orderId === order.id))
        fail('ALREADY_NOTIFIED', 'Confirmation already queued');
      const message = {
        id: `m-${s.outbox.length + 1}`,
        orderId: order.id,
        to: customer.email,
        subject: `Confirmation ${order.id}`,
        simulation: true,
      };
      s.outbox.push(message);
      return { messageId: message.id, orderId: order.id };
    } else if (name === 'cancel_order') {
      if (!['draft', 'reserved'].includes(order.status))
        fail('INVALID_TRANSITION', 'Only draft/reserved orders may be cancelled');
      if (order.status === 'reserved') product.stock += order.quantity;
      order.status = 'cancelled';
    }
    return { orderId: order.id, status: order.status };
  }
}
export function diff(before, after, path = '') {
  if (canonical(before) === canonical(after)) return [];
  if (
    before &&
    after &&
    typeof before === 'object' &&
    typeof after === 'object' &&
    Array.isArray(before) === Array.isArray(after)
  ) {
    return [...new Set([...Object.keys(before), ...Object.keys(after)])]
      .sort()
      .flatMap((key) =>
        diff(before[key], after[key], `${path}/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`),
      );
  }
  return [{ path: path || '/', before: before ?? null, after: after ?? null }];
}
export function runScenario({ seed = defaultSeed(), steps, faults = {}, expected = {} }) {
  if (!Array.isArray(steps)) fail('INVALID_SCENARIO', 'steps array required');
  const world = new World(seed, { faults }),
    before = world.snapshot();
  let error = null;
  for (const step of steps) {
    try {
      world.execute(step.tool, step.args, { idempotencyKey: step.idempotencyKey });
    } catch (e) {
      error = { code: e.code, message: e.message };
      break;
    }
  }
  const checks = [];
  if (own(expected, 'errorCode'))
    checks.push({
      name: 'errorCode',
      expected: expected.errorCode,
      actual: error?.code ?? null,
      passed: expected.errorCode === (error?.code ?? null),
    });
  if (own(expected, 'confirmedOrders')) {
    const actual = world.state.orders.filter((o) => o.status === 'confirmed').length;
    checks.push({
      name: 'confirmedOrders',
      expected: expected.confirmedOrders,
      actual,
      passed: actual === expected.confirmedOrders,
    });
  }
  if (own(expected, 'outboxCount'))
    checks.push({
      name: 'outboxCount',
      expected: expected.outboxCount,
      actual: world.state.outbox.length,
      passed: world.state.outbox.length === expected.outboxCount,
    });
  const unknown = Object.keys(expected).filter(
    (k) => !['errorCode', 'confirmedOrders', 'outboxCount'].includes(k),
  );
  if (unknown.length) fail('INVALID_EXPECTATION', unknown.join(', '));
  return {
    schemaVersion: 1,
    simulation: true,
    passed:
      checks.length > 0 &&
      checks.every((c) => c.passed) &&
      (!error || expected.errorCode === error.code),
    checks,
    error,
    state: world.snapshot(),
    events: world.events,
    changes: diff(before, world.state),
  };
}
