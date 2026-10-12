import {
  begin,
  check,
  object,
  id,
  list,
  indexed,
  graph,
  canonical,
  report,
  row,
  finding,
} from './common.js';

export function operationBasis(operation, { locale = 'fr' } = {}) {
  check(object(operation) && id(operation.kind) && object(operation.parameters), locale);
  return structuredClone({ kind: operation.kind, parameters: operation.parameters });
}

export function analyze(input, { locale = 'fr' } = {}) {
  begin(input, locale);
  check(id(input.partId) && list(input.journal) && input.journal.length <= 5000, locale);
  const g = graph(input.operations, locale);
  check(g.map.size > 0 && g.map.size <= 500, locale);
  for (const op of g.map.values())
    check(
      id(op.kind) &&
        object(op.parameters) &&
        ['inspect', 'idempotent', 'never'].includes(op.retryMode) &&
        Number.isInteger(op.maxAttempts) &&
        op.maxAttempts >= 1 &&
        op.maxAttempts <= 10,
      locale,
    );
  const states = new Map([...g.map.keys()].map((k) => [k, { attempts: [], applied: false }])),
    eventIds = new Set(),
    keys = new Map();
  let seq = -1;
  for (const e of input.journal) {
    check(
      object(e) &&
        id(e.id) &&
        !eventIds.has(e.id) &&
        Number.isSafeInteger(e.seq) &&
        e.seq > seq &&
        g.map.has(e.operationId) &&
        id(e.attemptId),
      locale,
      'invalidTransition',
    );
    eventIds.add(e.id);
    seq = e.seq;
    const op = g.map.get(e.operationId),
      state = states.get(op.id);
    let attempt = state.attempts.find((a) => a.id === e.attemptId);
    if (e.type === 'intent') {
      const last = state.attempts.at(-1);
      check(
        !attempt &&
          !state.applied &&
          op.dependsOn.every((k) => states.get(k).applied) &&
          state.attempts.length < op.maxAttempts &&
          id(e.idempotencyKey) &&
          object(e.commandBasis) &&
          canonical(e.commandBasis) === canonical(operationBasis(op)),
        locale,
        'invalidTransition',
      );
      if (last)
        check(
          last.stage === 'not_applied' ||
            (op.retryMode === 'idempotent' &&
              ['uncertain', 'running', 'intent'].includes(last.stage) &&
              last.key === e.idempotencyKey),
          locale,
          'invalidTransition',
        );
      if (last) check(op.retryMode !== 'never', locale, 'invalidTransition');
      if (keys.has(e.idempotencyKey))
        check(
          keys.get(e.idempotencyKey) === op.id && op.retryMode === 'idempotent',
          locale,
          'invalidTransition',
        );
      keys.set(e.idempotencyKey, op.id);
      attempt = {
        id: e.attemptId,
        key: e.idempotencyKey,
        commandBasis: structuredClone(e.commandBasis),
        stage: 'intent',
        eventIds: [e.id],
      };
      state.attempts.push(attempt);
      continue;
    }
    check(!!attempt, locale, 'invalidTransition');
    attempt.eventIds.push(e.id);
    if (e.type === 'started') {
      check(attempt.stage === 'intent', locale, 'invalidTransition');
      attempt.stage = 'running';
    } else if (e.type === 'completed') {
      check(
        ['intent', 'running', 'uncertain'].includes(attempt.stage),
        locale,
        'invalidTransition',
      );
      attempt.stage = 'applied';
      state.applied = true;
    } else if (['failed', 'interrupted'].includes(e.type)) {
      check(['intent', 'running'].includes(attempt.stage), locale, 'invalidTransition');
      attempt.stage = 'uncertain';
    } else if (e.type === 'inspection') {
      check(
        attempt.stage === 'uncertain' &&
          ['applied', 'not_applied', 'unknown'].includes(e.physicalOutcome),
        locale,
        'invalidTransition',
      );
      attempt.stage = e.physicalOutcome === 'unknown' ? 'uncertain' : e.physicalOutcome;
      state.applied ||= e.physicalOutcome === 'applied';
    } else check(false, locale, 'invalidTransition');
  }
  const plan = [],
    rows = [],
    findings = [];
  for (const k of g.order) {
    const op = g.map.get(k),
      s = states.get(k),
      last = s.attempts.at(-1);
    const waitingFor = op.dependsOn.filter((dep) => !states.get(dep).applied);
    let state, action, key;
    if (s.applied) {
      state = 'done';
      action = 'none';
      key = 'operationComplete';
    } else if (waitingFor.length) {
      state = 'blocked';
      action = 'wait';
      key = 'dependencyPending';
    } else if (!last) {
      state = 'readyOperation';
      action = 'start';
      key = 'operationReady';
    } else if (last.stage === 'running') {
      state = 'running';
      action = 'wait_or_record_interruption';
      key = 'operationRunning';
    } else if (last.stage === 'intent' || last.stage === 'uncertain') {
      if (op.retryMode === 'idempotent' && s.attempts.length < op.maxAttempts) {
        state = 'retry';
        action = 'replay_same_key';
        key = 'idempotentReplay';
      } else {
        state = 'inspect';
        action = 'inspect';
        key = 'outcomeUnknown';
      }
    } else if (last.stage === 'not_applied') {
      if (op.retryMode === 'never' || s.attempts.length >= op.maxAttempts) {
        state = 'blocked';
        action = 'manual_review';
        key = 'retryForbidden';
      } else {
        state = 'retry';
        action = 'new_attempt';
        key = 'absenceConfirmed';
      }
    }
    const item = {
      id: k,
      state,
      action,
      waitingFor,
      attempts: structuredClone(s.attempts),
      idempotencyKey: action === 'replay_same_key' ? last.key : null,
    };
    plan.push(item);
    rows.push(row(k, state, key, locale, { ids: waitingFor.join(', ') }, s.attempts.length));
    if (state === 'inspect' || action === 'manual_review')
      findings.push(finding(key, locale, { ids: k }));
  }
  const status = plan.every((p) => p.state === 'done')
    ? 'pass'
    : plan.some((p) => p.action === 'manual_review')
      ? 'fail'
      : 'inconclusive';
  return report('FabResume', input, locale, status, rows, findings, {
    partId: input.partId,
    lastSequence: seq,
    plan,
  });
}
