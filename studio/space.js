import { initI18n, getLocale, tr } from './i18n.js';
import { initFrontier } from './space-frontier.js';
const $ = (selector) => document.querySelector(selector);
let token,
  report,
  lastMission,
  busy = false;
const pretty = (value) => JSON.stringify(value, null, 2);
function node(tag, text, className) {
  const item = document.createElement(tag);
  if (text !== undefined) item.textContent = String(text);
  if (className) item.className = className;
  return item;
}
function table(target, headers, rows) {
  const result = node('table'),
    head = node('tr');
  headers.forEach((text) => head.append(node('th', text)));
  result.append(head);
  for (const { values, id, bad = false } of rows) {
    const row = node('tr');
    if (id) row.id = id;
    for (const value of values) row.append(node('td', value));
    if (bad) row.lastChild.className = 'bad';
    result.append(row);
  }
  $(target).replaceChildren(result);
}
function timeline() {
  $('#timeline').replaceChildren();
  for (const vehicle of lastMission.vehicles) {
    const row = node('div', undefined, 'timeline-row');
    row.append(node('b', vehicle.id));
    const track = node('div', undefined, 'timeline-track');
    track.style.gridTemplateColumns = `repeat(${lastMission.horizonSlots}, minmax(0, 1fr))`;
    for (const event of report.replay.events.filter((event) => event.vehicleId === vehicle.id)) {
      const block = node('div', event.taskId, `task ${event.status}`);
      block.style.gridColumn = `${event.slot + 1} / span ${event.end - event.slot}`;
      block.title = `${event.label} · ${event.statusLabel} · ${event.slot}–${event.end}`;
      track.append(block);
    }
    row.append(track);
    $('#timeline').append(row);
  }
  $('#unassigned').replaceChildren(
    ...report.plan.unassigned.map((item) => node('p', `${item.taskId} · ${item.message}`)),
  );
}
function energy() {
  const colors = ['#72ebc1', '#bfa8ff', '#ffce8a', '#87caff', '#ffaeab', '#edf0f4'];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 600 180');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', tr('spaceEnergy'));
  const max = Math.max(...lastMission.vehicles.map((vehicle) => vehicle.batteryCapacityWh)),
    min = Math.min(0, ...report.replay.telemetry.map((sample) => sample.batteryWh));
  const y = (value) => 150 - ((value - min) / (max - min)) * 125;
  const shape = (tag, attrs) => {
    const element = document.createElementNS(svg.namespaceURI, tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, String(value));
    svg.append(element);
    return element;
  };
  for (const value of [min, max]) {
    const label = shape('text', { x: 1, y: y(value), fill: '#a9bec4', 'font-size': 11 });
    label.textContent = String(Math.round(value));
  }
  const legend = node('div', undefined, 'legend');
  lastMission.vehicles.forEach((vehicle, index) => {
    const points = report.replay.telemetry
      .filter((sample) => sample.vehicleId === vehicle.id)
      .map(
        (sample) =>
          `${30 + (sample.slot / Math.max(1, lastMission.horizonSlots - 1)) * 550},${y(sample.batteryWh)}`,
      )
      .join(' ');
    shape('polyline', { points, stroke: colors[index], fill: 'none', 'stroke-width': 2.5 });
    shape('line', {
      x1: 30,
      x2: 580,
      y1: y(vehicle.reserveWh),
      y2: y(vehicle.reserveWh),
      stroke: colors[index],
      'stroke-dasharray': '4 5',
      opacity: 0.6,
    });
    const label = node('span', `${vehicle.id} · ${tr('spaceReserve')} ${vehicle.reserveWh} Wh`);
    label.style.color = colors[index];
    legend.append(label);
  });
  const label = shape('text', { x: 30, y: 175, fill: '#a9bec4', 'font-size': 11 });
  label.textContent = `${tr('spaceSlot')} 0 → ${lastMission.horizonSlots - 1}`;
  $('#energy').replaceChildren(svg, legend);
}
function render() {
  if (!report) return;
  $('#metrics').replaceChildren(
    ...[
      [`${report.replay.completed.length}/${lastMission.tasks.length}`, tr('spaceObjectives')],
      [report.replay.findings.length, tr('spaceViolations')],
      [`${report.validation.passed}/${report.validation.total}`, tr('spaceCases')],
      [lastMission.vehicles.length, tr('spaceVehicles')],
    ].map(([value, label]) => {
      const metric = node('div', undefined, 'metric');
      metric.append(node('b', value), node('span', label));
      return metric;
    }),
  );
  timeline();
  energy();
  table(
    '#events',
    [tr('spaceSlot'), tr('spaceVehicle'), tr('spaceTask'), tr('spaceStorage'), tr('spaceStatus')],
    report.replay.events.map((event) => ({
      id: event.id,
      bad: event.status !== 'completed',
      values: [event.slot, event.vehicleId, event.taskId, event.storageMb, event.statusLabel],
    })),
  );
  table(
    '#samples',
    [tr('spaceSlot'), tr('spaceVehicle'), tr('spaceEnergy'), tr('spaceStorage')],
    report.replay.telemetry.map((sample) => ({
      id: sample.id,
      values: [sample.slot, sample.vehicleId, sample.batteryWh, sample.storageMb],
    })),
  );
  $('#assistant-summary').textContent = report.assistant.message;
  $('#alerts').replaceChildren(
    ...report.assistant.alerts.map((alert) => {
      const box = node('div', undefined, 'alert');
      box.append(node('b', alert.title), node('p', alert.message));
      for (const id of alert.sourceIds) {
        const a = node('a', id);
        a.href = `#${id}`;
        box.append(a);
      }
      return box;
    }),
  );
  const proposal = report.assistant.proposal;
  $('#preview-summary').textContent = tr('spacePreviewCount', {
    assigned: proposal.schedule.length,
    unassigned: proposal.unassigned.length,
  });
  table(
    '#preview',
    [tr('spaceSlot'), tr('spaceVehicle'), tr('spaceTask')],
    proposal.schedule.map((item) => ({ values: [item.start, item.vehicleId, item.taskId] })),
  );
  $('#validation-summary').textContent = report.validation.message;
  table(
    '#cases',
    [tr('spaceFault'), tr('spaceVehicle'), tr('spaceObjectives'), tr('spaceInvariant')],
    report.validation.cases.map((item) => ({
      bad: !item.passed,
      values: [
        item.label,
        item.fault.vehicleId ?? '—',
        `${item.completed}/${item.objectives}`,
        tr(item.passed ? 'spacePassed' : 'spaceFailed'),
      ],
    })),
  );
  $('#hashes').textContent =
    `inputSha256: ${report.inputSha256}\ntraceSha256: ${report.replay.traceSha256}`;
  $('#report').textContent = pretty(report);
}
function copy() {
  document.querySelectorAll('[data-copy]').forEach((item) => {
    item.textContent = tr(item.dataset.copy);
  });
}
async function run() {
  if (busy) return;
  busy = true;
  $('#run').disabled = true;
  $('#export').disabled = true;
  for (const selector of ['#language-select', '#fault', '#policy', '#mission'])
    $(selector).disabled = true;
  $('#status').textContent = tr('spaceRunning');
  try {
    const mission = JSON.parse($('#mission').value);
    const response = await fetch('/api/space/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-studio-token': token },
      body: pretty({
        mission,
        locale: getLocale(),
        policy: $('#policy').value,
        fault: { kind: $('#fault').value, start: 0 },
      }),
    });
    const value = await response.json();
    if (!response.ok) throw Error();
    report = value;
    lastMission = mission;
    render();
    $('#export').disabled = false;
    $('#status').textContent = tr('spaceReady');
  } catch {
    $('#status').textContent = tr('spaceError');
  } finally {
    busy = false;
    $('#run').disabled = false;
    for (const selector of ['#language-select', '#fault', '#policy', '#mission'])
      $(selector).disabled = false;
  }
}
$('#run').addEventListener('click', run);
$('#export').addEventListener('click', () => {
  if (!report) return;
  const url = URL.createObjectURL(new Blob([pretty(report)], { type: 'application/json' }));
  const a = node('a');
  a.href = url;
  a.download = `space-mission-${report.locale}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
document.addEventListener('frontier:localechange', () => {
  copy();
  if (token)
    $('#status').textContent = report
      ? tr('spaceDisplayedLocale', { locale: report.locale.toUpperCase() })
      : tr('spaceIdle');
});
$('#alerts').addEventListener('click', (event) => {
  if (event.target.closest('a')?.hash.startsWith('#telemetry-')) $('#samples-details').open = true;
});
initI18n();
copy();
$('#status').textContent = tr('spaceIdle');
try {
  const response = await fetch('/api/space/scenario');
  if (!response.ok) throw Error();
  const scenario = await response.json();
  token = scenario.token;
  $('#mission').value = pretty(scenario.mission);
  $('#run').disabled = false;
  await initFrontier(token);
} catch {
  $('#status').textContent = tr('spaceError');
}

function updateCommonsLinks() {
  for (const a of document.querySelectorAll('.commons-entry')) {
    const url = new URL(a.href);
    url.searchParams.set('lang', document.documentElement.lang);
    a.href = url.href;
  }
}
document.addEventListener('frontier:localechange', updateCommonsLinks);
updateCommonsLinks();
