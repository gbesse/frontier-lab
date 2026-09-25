import { createHash } from 'node:crypto';
const error = (code, message) => {
  throw Object.assign(new Error(message), { code });
};
const record = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const safeName = (n) =>
  typeof n === 'string' &&
  /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(n) &&
  !['constructor', 'prototype', '__proto__'].includes(n);
const scalar = (v) =>
  v === null ||
  (['string', 'number', 'boolean'].includes(typeof v) &&
    (!(typeof v === 'number') || Number.isFinite(v)));
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const hash = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex');
function assertRecord(v, label) {
  if (!record(v)) error('INVALID_DOCUMENT', `${label} must be an object`);
}

export function learn(demos, { name = 'order_skill' } = {}) {
  if (!safeName(name)) error('INVALID_NAME', 'Use a simple skill name');
  if (!Array.isArray(demos) || demos.length < 2 || demos.length > 100)
    error('NEED_DEMONSTRATIONS', 'Supply 2–100 demonstrations');
  for (const d of demos) {
    assertRecord(d.inputs, 'inputs');
    if (!Array.isArray(d.steps) || !d.steps.length || d.steps.length > 100)
      error('INVALID_TRACE', 'Each trace needs 1–100 steps');
    for (const s of d.steps) {
      assertRecord(s.args, 'args');
      assertRecord(s.result, 'result');
      if (!safeName(s.tool) || s.ok === false)
        error('INVALID_TRACE', 'Only successful named tool calls can teach a skill');
    }
  }
  const keys = Object.keys(demos[0].inputs).sort(),
    count = demos[0].steps.length;
  if (demos.some((d) => !equal(Object.keys(d.inputs).sort(), keys) || d.steps.length !== count))
    error('DIVERGENT_TRACE', 'Input keys and step counts differ; split the procedures');
  const parameters = Object.fromEntries(
    keys.map((k) => {
      if (!safeName(k) || !demos.every((d) => scalar(d.inputs[k]) && d.inputs[k] !== null))
        error('INVALID_INPUT', `Scalar input required: ${k}`);
      const type = typeof demos[0].inputs[k];
      if (demos.some((d) => typeof d.inputs[k] !== type)) error('DIVERGENT_TYPE', k);
      return [k, { type, examples: [...new Set(demos.map((d) => d.inputs[k]))] }];
    }),
  );
  const steps = [];
  const warnings = [];
  for (let i = 0; i < count; i++) {
    const sample = demos[0].steps[i],
      argKeys = Object.keys(sample.args).sort();
    if (
      demos.some(
        (d) =>
          d.steps[i].tool !== sample.tool || !equal(Object.keys(d.steps[i].args).sort(), argKeys),
      )
    )
      error(
        'DIVERGENT_TRACE',
        `Step ${i + 1} differs; conditional branches require a separate skill`,
      );
    const args = {};
    for (const key of argKeys) {
      if (!safeName(key) || !demos.every((d) => scalar(d.steps[i].args[key])))
        error('UNSUPPORTED_ARGUMENT', `Step ${i + 1}.${key}: flat scalar arguments required`);
      const values = demos.map((d) => d.steps[i].args[key]);
      const varying = !values.every((v) => equal(v, values[0]));
      const inputs = keys.filter((k) => demos.every((d, j) => equal(d.inputs[k], values[j])));
      if (varying && inputs.length > 1)
        error(
          'AMBIGUOUS_BINDING',
          `Step ${i + 1}.${key}: distinguish inputs ${inputs.join(', ')} in another demonstration`,
        );
      if (inputs.length === 1 && varying) {
        args[key] = { kind: 'input', name: inputs[0] };
        continue;
      }
      const refs = [];
      for (let prev = 0; prev < i; prev++)
        for (const field of Object.keys(demos[0].steps[prev].result)) {
          if (
            safeName(field) &&
            field === key &&
            demos.every(
              (d, j) =>
                Object.hasOwn(d.steps[prev].result, field) &&
                equal(d.steps[prev].result[field], values[j]),
            )
          )
            refs.push({ kind: 'result', step: prev, field });
        }
      if (refs.length) {
        args[key] = refs[0];
        if (refs.length > 1)
          warnings.push(
            `Step ${i + 1}.${key}: repeated result lineage; using first producer step ${refs[0].step + 1}. Validate on held-out cases.`,
          );
        continue;
      }
      if (!varying) {
        if (inputs.length)
          error(
            'AMBIGUOUS_CONSTANT',
            `Step ${i + 1}.${key} matches an input that never varies; supply a differing demonstration`,
          );
        args[key] = { kind: 'literal', value: values[0] };
        continue;
      }
      error(
        'UNEXPLAINED_VARIATION',
        `Step ${i + 1}.${key}: no input or prior result explains the variation`,
      );
    }
    steps.push({ tool: sample.tool, args });
  }
  const skill = {
    schemaVersion: 1,
    name,
    parameters,
    permissions: [...new Set(steps.map((s) => s.tool))],
    steps,
    onError: 'stop',
    provenance: {
      method: 'symbolic-trace-binding',
      demonstrations: demos.length,
      traceHashes: demos.map(hash),
    },
    warnings: [...new Set(warnings)],
  };
  validate(skill);
  return skill;
}

export function validate(skill) {
  assertRecord(skill, 'skill');
  if (skill.schemaVersion !== 1 || !safeName(skill.name) || skill.onError !== 'stop')
    error('INVALID_SKILL', 'schemaVersion=1, simple name and onError=stop required');
  assertRecord(skill.parameters, 'parameters');
  for (const [k, p] of Object.entries(skill.parameters))
    if (!safeName(k) || !record(p) || !['string', 'number', 'boolean'].includes(p.type))
      error('INVALID_SKILL', `Invalid parameter ${k}`);
  if (!Array.isArray(skill.steps) || !skill.steps.length || skill.steps.length > 100)
    error('INVALID_SKILL', '1–100 steps required');
  if (!Array.isArray(skill.permissions) || skill.permissions.some((p) => !safeName(p)))
    error('INVALID_SKILL', 'Explicit permissions required');
  for (const [i, s] of skill.steps.entries()) {
    if (!record(s) || !safeName(s.tool) || !skill.permissions.includes(s.tool))
      error('INVALID_SKILL', `Undeclared tool at step ${i + 1}`);
    assertRecord(s.args, 'args');
    for (const [key, b] of Object.entries(s.args)) {
      if (!safeName(key) || !record(b)) error('INVALID_SKILL', 'Invalid argument binding');
      if (b.kind === 'input') {
        if (!safeName(b.name) || !Object.hasOwn(skill.parameters, b.name))
          error('INVALID_SKILL', 'Unknown input binding');
      } else if (b.kind === 'result') {
        if (!Number.isInteger(b.step) || b.step < 0 || b.step >= i || !safeName(b.field))
          error('INVALID_SKILL', 'Result binding must reference an earlier step');
      } else if (b.kind === 'literal') {
        if (!scalar(b.value)) error('INVALID_SKILL', 'Literal must be a finite JSON scalar');
      } else error('INVALID_SKILL', 'Unknown binding kind');
    }
  }
  return { valid: true, steps: skill.steps.length, permissions: skill.permissions };
}

export async function execute(
  skill,
  inputs,
  adapter,
  { allow = [], runId = 'rehearsal', allowLive = false } = {},
) {
  validate(skill);
  assertRecord(inputs, 'inputs');
  if (!adapter || typeof adapter.execute !== 'function')
    error('INVALID_ADAPTER', 'An execute adapter is required');
  if (adapter.simulation !== true && !allowLive)
    error('LIVE_NOT_AUTHORIZED', 'Explicit allowLive required for a non-simulation adapter');
  if (typeof runId !== 'string' || !runId.trim() || runId.length > 200)
    error('INVALID_RUN_ID', 'A short, nonempty run ID is required');
  const missing = skill.permissions.filter((p) => !allow.includes(p));
  if (missing.length) error('PERMISSION_DENIED', `Missing permissions: ${missing.join(', ')}`);
  if (!equal(Object.keys(inputs).sort(), Object.keys(skill.parameters).sort()))
    error('INVALID_INPUT', 'Input keys must match parameters exactly');
  for (const [k, p] of Object.entries(skill.parameters))
    if (!scalar(inputs[k]) || typeof inputs[k] !== p.type)
      error('INVALID_INPUT', `${k} must have type ${p.type}`);
  const steps = [];
  const identity = hash({ skill, inputs, runId });
  for (const [i, s] of skill.steps.entries()) {
    try {
      const args = Object.fromEntries(
        Object.entries(s.args).map(([k, b]) => {
          let v =
            b.kind === 'input'
              ? inputs[b.name]
              : b.kind === 'literal'
                ? b.value
                : steps[b.step]?.result?.[b.field];
          if (!scalar(v)) error('MISSING_RESULT', `Step ${i + 1}: result field unavailable`);
          return [k, v];
        }),
      );
      const result = await adapter.execute(s.tool, args, {
        idempotencyKey: `teachpack:${identity}:${i}`,
      });
      assertRecord(result, 'adapter result');
      steps.push({ tool: s.tool, args, result, ok: true });
    } catch (e) {
      return {
        schemaVersion: 1,
        ok: false,
        simulation: adapter.simulation === true,
        stoppedAt: i,
        steps,
        error: { code: e.code ?? 'ADAPTER_ERROR', message: e.message },
        inputs,
      };
    }
  }
  return { schemaVersion: 1, ok: true, simulation: adapter.simulation === true, inputs, steps };
}

export function recordDemo(world, inputs) {
  const steps = [];
  const call = (tool, args) => {
    const result = world.execute(tool, args);
    steps.push({ tool, args, result, ok: true });
    return result;
  };
  const { orderId } = call('create_order', inputs);
  call('reserve_order', { orderId });
  call('confirm_order', { orderId });
  call('queue_email', { orderId });
  return { inputs: structuredClone(inputs), steps };
}
