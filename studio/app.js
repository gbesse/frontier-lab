import { initVisualStudio } from './visual.js';
import { initI18n, tr, translateError } from './i18n.js';
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const pretty = (v) => JSON.stringify(v, null, 2);
let state,
  variant = 'normal',
  inspected = false,
  lastExitReport = null;
function el(tag, text, className) {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (className) n.className = className;
  return n;
}
function toast(message) {
  toast.key = typeof message === 'object' ? message.i18nKey : null;
  $('#toast').textContent = toast.key ? tr(toast.key) : String(message);
  $('#toast').hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($('#toast').hidden = true), 6000);
}
async function api(path, input) {
  const response = await fetch(path, {
    method: input === undefined ? 'GET' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(state ? { 'x-studio-token': state.token } : {}),
    },
    ...(input === undefined ? {} : { body: JSON.stringify(input) }),
  });
  const value = await response.json();
  if (!response.ok) throw Error(value.error?.message ?? 'Erreur');
  return value;
}
function action(selector, fn) {
  $(selector).addEventListener('click', async (e) => {
    const b = e.currentTarget;
    b.disabled = true;
    try {
      await fn();
    } catch (error) {
      toast(translateError(error));
    } finally {
      b.disabled = false;
    }
  });
}
function navigate() {
  const page = location.hash.slice(1) || 'home',
    valid = $('#' + CSS.escape(page))?.classList.contains('page') ? page : 'home';
  $$('.page').forEach((p) => (p.hidden = p.id !== valid));
  $$('nav a').forEach((a) => a.classList.toggle('active', a.hash === '#' + valid));
  $('#page-name').textContent = {
    home: tr('pageHome'),
    teach: tr('pageTeach'),
    branch: tr('pageBranch'),
    exit: tr('pageExit'),
    checkout: tr('pageCheckout'),
  }[valid];
}
function option(value, text) {
  const o = el('option', text);
  o.value = value;
  return o;
}
async function refresh() {
  state = await api('/api/state');
  renderTeach();
}
function renderTeach() {
  $('#teach-metrics').replaceChildren(
    ...[
      [state.demos.length, tr('demos')],
      [state.skill?.steps.length ?? 0, tr('stepsCompiled')],
      [state.teachRuns.filter((r) => r.scenarioPassed).length, tr('rehearsalsPassed')],
    ].map(([n, label]) => {
      const x = el('div', undefined, 'metric');
      x.append(el('b', String(n)), el('span', label));
      return x;
    }),
  );
  $('#skill-json').textContent = state.skill ? pretty(state.skill) : tr('skillHint');
  $('#skill-summary').textContent = state.skill
    ? tr('skillSummary', {
        parameters: Object.keys(state.skill.parameters).length,
        permissions: state.skill.permissions.length,
      })
    : tr('noSkill');
  $('#skill-download').disabled = !state.skill;
  $$('[data-tool]').forEach(
    (b, i) => (b.disabled = !state.recording || state.recording.steps.length !== i),
  );
  $('#record-status').textContent = state.recording
    ? tr('recording', { count: state.recording.steps.length })
    : tr('recorded', { count: state.demos.length });
}
function summary(target, passed, text) {
  $(target).replaceChildren(
    el('div', (passed ? '✓ ' : '× ') + text, passed ? 'success' : 'failure'),
  );
}
function download(value, name) {
  const url = URL.createObjectURL(new Blob([pretty(value)], { type: 'application/json' })),
    a = el('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function showBranch(r) {
  const checkNames = {
    'Erreur attendue': 'expectedError',
    'Aucun email simulé': 'noEmail',
    'Une commande confirmée': 'oneConfirmed',
    'Un seul email simulé': 'oneEmail',
  };
  summary(
    '#branch-checks',
    r.scenarioPassed,
    `${tr(r.scenarioPassed ? 'scenarioPass' : 'scenarioFail')} — ${r.checks.map((c) => (c.passed ? '✓ ' : '× ') + tr(checkNames[c.name] ?? c.name)).join(' · ')}`,
  );
  const table = el('table'),
    head = el('tr');
  [tr('field'), tr('before'), tr('after')].forEach((t) => head.append(el('th', t)));
  table.append(head);
  for (const change of r.changes) {
    const row = el('tr');
    row.append(el('td', change.path));
    for (const k of ['before', 'after']) {
      const cell = el('td');
      cell.append(el('pre', pretty(change[k])));
      row.append(cell);
    }
    table.append(row);
  }
  $('#branch-changes').replaceChildren(r.changes.length ? table : el('p', tr('noStateChange')));
  $('#branch-events').replaceChildren(
    ...r.events.map((e) => {
      const n = el('div', `${e.ok ? '✓' : '×'} ${e.sequence}. ${e.tool}`, 'event');
      n.append(
        el('small', e.ok ? pretty(e.result) : `${e.error.code} — ${e.error.message}`),
        el('small', `${e.before.slice(0, 12)} → ${e.after.slice(0, 12)}`),
      );
      return n;
    }),
  );
}
function exitInput() {
  return {
    source: JSON.parse($('#exit-source').value),
    mapping: JSON.parse($('#exit-mapping').value),
  };
}
function invalidate() {
  inspected = false;
  $('#exit-generate').disabled = true;
  $('#exit-artifact').replaceChildren();
}
function checkoutHistory() {
  $('#checkout-history').replaceChildren(
    ...state.checkoutReports.slice(0, 8).map((r) => {
      const n = el(
        'div',
        `${tr(r.passed ? 'checkoutPass' : 'checkoutFail')} · ${tr(r.mode === 'before' ? 'checkoutBefore' : 'checkoutAfter')} · ${r.driver}`,
        'event',
      );
      n.append(
        el(
          'small',
          tr('checkoutHistory', {
            duration: r.durationMs,
            requests: r.requests.length,
            driver: tr(r.syntheticAgent ? 'deterministic' : 'model'),
          }),
        ),
      );
      return n;
    }),
  );
  const r = state.checkoutReports[0];
  if (r) {
    $('#checkout-proof').textContent = pretty({
      passed: r.passed,
      receipt: r.receipt,
      error: r.error,
      steps: r.steps,
    });
    $('#checkout-fixes').replaceChildren(...r.recommendations.map((t) => el('p', t, 'muted')));
  }
}
initI18n();
await refresh();
$('#teach-customer').replaceChildren(...state.seed.customers.map((c) => option(c.id, c.name)));
$('#teach-sku').replaceChildren(...state.seed.products.map((p) => option(p.sku, p.name)));
action('#teach-start', async () => {
  await api('/api/teach/record/start', {
    inputs: {
      customerId: $('#teach-customer').value,
      sku: $('#teach-sku').value,
      quantity: Number($('#teach-quantity').value),
    },
  });
  await refresh();
});
for (const b of $$('[data-tool]'))
  b.addEventListener('click', async () => {
    b.disabled = true;
    try {
      await api('/api/teach/record/step', { tool: b.dataset.tool });
      await refresh();
    } catch (e) {
      toast(translateError(e));
      await refresh();
    }
  });
action('#teach-examples', async () => {
  await api('/api/teach/examples', {});
  await refresh();
  toast({ i18nKey: 'examplesLoaded' });
});
action('#teach-learn', async () => {
  await api('/api/teach/learn', {});
  await refresh();
  toast({ i18nKey: 'skillCompiled' });
});
action('#teach-run', async () => {
  const r = await api('/api/teach/run', {});
  summary(
    '#teach-result',
    r.scenarioPassed,
    tr('unseenResult', {
      state: tr(r.scenarioPassed ? 'unseenPass' : 'failure'),
      steps: r.steps.length,
      outbox: r.state.outbox.length,
    }),
  );
  await refresh();
});
$('#skill-download').addEventListener('click', () => download(state.skill, 'teachpack-skill.json'));
$$('[data-variant]').forEach((b) =>
  b.addEventListener('click', () => {
    variant = b.dataset.variant;
    $$('[data-variant]').forEach((n) => n.classList.toggle('selected', n === b));
  }),
);
action('#branch-run', async () => showBranch(await api('/api/branch/run', { variant })));
$('#exit-source').value = pretty(state.exitSource);
$('#exit-mapping').value = pretty(state.defaultMapping);
$('#exit-example').addEventListener('click', () => {
  $('#exit-source').value = pretty(state.exitSource);
  $('#exit-mapping').value = pretty(state.defaultMapping);
  invalidate();
});
$('#exit-file').addEventListener('change', async (e) => {
  try {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 7 * 1024 * 1024) throw Error(tr('exitFileLimit'));
      $('#exit-source').value = pretty(JSON.parse(await file.text()));
      invalidate();
    }
  } catch (error) {
    toast(translateError(error));
  }
});
['#exit-source', '#exit-mapping'].forEach((id) => $(id).addEventListener('input', invalidate));
function renderExitReport(r) {
  inspected = r.ok;
  $('#exit-generate').disabled = !r.ok;
  const container = $('#exit-report');
  container.replaceChildren(
    el('div', tr(r.ok ? 'exitIntegrity' : 'exitBlocked'), r.ok ? 'success' : 'failure'),
    el(
      'p',
      tr('exitCounts', {
        customers: r.counts.customers,
        tickets: r.counts.tickets,
        attachments: r.counts.attachments,
        bytes: r.attachmentBytes,
      }),
    ),
  );
  for (const e of r.errors)
    container.append(el('p', `${e.code}: ${e.path} — ${e.message}`, 'failure'));
  container.append(
    el(
      'p',
      r.unmapped.length
        ? tr('exitUnmapped', {
            count: r.unmapped.length,
            paths: r.unmapped.map((x) => x.path).join(', '),
          })
        : tr('exitNone'),
      r.unmapped.length ? 'failure' : 'muted',
    ),
  );
}
action('#exit-inspect', async () => {
  const { report: r } = await api('/api/exit/inspect', exitInput());
  lastExitReport = r;
  renderExitReport(r);
});
action('#exit-generate', async () => {
  if (!inspected) throw Error(tr('exitInspectFirst'));
  const r = await api('/api/exit/generate', {
    ...exitInput(),
    acceptLoss: $('#exit-accept').checked,
  });
  const a = el('a', tr('exitDownload'), 'button');
  a.href = r.download;
  $('#exit-artifact').replaceChildren(
    el('p', tr('exitGenerated')),
    a,
    el('p', r.directory, 'muted'),
  );
});
$('#checkout-mode').addEventListener(
  'change',
  () => ($('#checkout-open').href = '/fixture/checkout?mode=' + $('#checkout-mode').value),
);
action('#checkout-run', async () => {
  $('#checkout-proof').textContent = tr('checkoutRunning');
  await api('/api/checkout/run', {
    mode: $('#checkout-mode').value,
    driver: $('#checkout-driver').value,
  });
  await refresh();
  checkoutHistory();
});
checkoutHistory();
if (state.branchReports[0]) showBranch(state.branchReports[0]);
initVisualStudio({ api, getState: () => state, refresh, toast });
navigate();
window.addEventListener('hashchange', navigate);
document.addEventListener('frontier:localechange', () => {
  if (!$('#toast').hidden) {
    if (toast.key) $('#toast').textContent = tr(toast.key);
    else $('#toast').hidden = true;
  }
  renderTeach();
  checkoutHistory();
  if (state.branchReports[0]) showBranch(state.branchReports[0]);
  if (lastExitReport) renderExitReport(lastExitReport);
  navigate();
});
