import { getLocale, setLocale, tr, messageTranslations } from './i18n.js';
import { frontierConfig, sharedFrontier, readSharedFrontier } from './space-lib/frontier-config.js';
const $ = (selector) => document.querySelector(selector);
const node = (tag, text) => {
  const item = document.createElement(tag);
  if (text !== undefined) item.textContent = String(text);
  return item;
};
function table(target, headers, rows) {
  const result = node('table'),
    head = node('tr');
  headers.forEach((text) => head.append(node('th', text)));
  result.append(head);
  rows.forEach((values) => {
    const row = node('tr');
    values.forEach((text) => row.append(node('td', text)));
    result.append(row);
  });
  $(target).replaceChildren(result);
}
function download(value, name, type) {
  const url = URL.createObjectURL(new Blob([value], { type })),
    a = node('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function initFrontier(token) {
  let report,
    busy = false,
    validLink = true,
    daily;
  const inputs = [
    '#frontier-destination',
    '#frontier-policy',
    '#frontier-seed',
    '#frontier-outage',
    '#frontier-conflict',
    '#frontier-inject',
  ];
  const apply = (config) => {
    $('#frontier-destination').value = config.destination;
    $('#frontier-policy').value = config.relayPolicy;
    $('#frontier-seed').value = config.seed;
    $('#frontier-outage').checked = config.outage;
    $('#frontier-conflict').checked = config.doubleSpend;
    $('#frontier-inject').checked = config.signalInjection;
  };
  const read = () =>
    frontierConfig({
      destination: $('#frontier-destination').value,
      relayPolicy: $('#frontier-policy').value,
      seed: Number($('#frontier-seed').value),
      outage: $('#frontier-outage').checked,
      doubleSpend: $('#frontier-conflict').checked,
      signalInjection: $('#frontier-inject').checked,
      locale: getLocale(),
    });
  const atlas = () => {
    $('#atlas-link').href = `/space/explore?lang=${getLocale()}`;
  };
  atlas();
  document.addEventListener('frontier:localechange', () => {
    atlas();
    if (report)
      $('#frontier-status').textContent = tr('spaceDisplayedLocale', {
        locale: report.locale.toUpperCase(),
      });
  });
  try {
    const config = readSharedFrontier(location.search);
    if (new URLSearchParams(location.search).has('lang')) setLocale(config.locale);
    else config.locale = getLocale();
    apply(config);
  } catch {
    validLink = false;
    $('#frontier-status').textContent = tr('frontierError');
  }
  const controls = (value) => {
    inputs.forEach((selector) => ($(selector).disabled = value));
    $('#frontier-run').disabled = value;
    $('#frontier-daily').disabled = value || !daily;
  };
  const resultsDisabled = (value) =>
    ['#frontier-share', '#frontier-export', '#frontier-ion', '#frontier-card'].forEach(
      (selector) => ($(selector).disabled = value),
    );
  function render() {
    const format = (value) =>
      new Intl.NumberFormat(report.locale, { maximumFractionDigits: 2 }).format(value);
    const duration = (seconds) =>
      tr('frontierDuration', {
        seconds: format(seconds),
        years: format(seconds / (365.25 * 86400)),
      });
    const light = $('#frontier-light');
    light.replaceChildren();
    const heading = node('b', report.light.label);
    heading.className = 'destination';
    light.append(heading);
    for (const [label, value] of [
      ['frontierOneWay', duration(report.light.oneWaySeconds)],
      ['frontierRoundTrip', duration(report.light.roundTripSeconds)],
      ['frontierArrival', report.light.arrivesAt],
      ['frontierReply', report.light.earliestReplyAt],
    ]) {
      const item = node('div');
      item.className = 'light-stat';
      item.append(node('span', tr(label)), node('strong', value));
      light.append(item);
    }
    light.append(node('p', report.light.notice));
    $('#frontier-score').textContent = tr('frontierScore', {
      delivered: report.network.delivered,
      total: report.network.total,
      comparison: report.comparison.delivered,
    });
    table(
      '#frontier-network',
      [tr('frontierBundle'), tr('frontierRoute'), tr('frontierStatus')],
      report.network.bundles.map((bundle) => [
        bundle.id,
        bundle.hops
          .map((hop) => `${hop.from} → ${hop.to} (+${format(hop.waitingSec)} s)`)
          .join(' / ') || '—',
        bundle.label,
      ]),
    );
    $('#frontier-network-note').textContent = report.network.notice;
    $('#frontier-payment').textContent = tr('frontierPayment', {
      before: report.economy.before.payments.filter((item) => item.status === 'pending').length,
      after: report.economy.after.settledUnits,
    });
    $('#frontier-conserved').textContent = tr('frontierConserved', {
      total: report.economy.after.conservedUnits,
      escrow: report.economy.after.escrowUnits,
      seconds: format(report.economy.settleAt),
    });
    table(
      '#frontier-credits',
      [tr('frontierBundle'), 'SIM-CREDIT', tr('frontierStatus')],
      report.economy.after.payments.map((payment) => [
        payment.proofId,
        payment.amountUnits,
        payment.label,
      ]),
    );
    $('#frontier-credits-note').textContent = report.economy.after.notice;
    $('#frontier-candidates').textContent = tr('frontierCandidates', {
      count: report.signals.candidates,
    });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 640 150');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', tr('frontierSpectrum'));
    [...report.spectrogram.on, ...report.spectrogram.off].forEach((row, y) =>
      row.forEach((power, x) => {
        const cell = document.createElementNS(svg.namespaceURI, 'rect');
        cell.setAttribute('x', x * 20);
        cell.setAttribute('y', y * 22 + (y >= 3 ? 16 : 0));
        cell.setAttribute('width', 18);
        cell.setAttribute('height', 20);
        cell.setAttribute(
          'fill',
          power > 8 ? (y < 3 ? '#72ebc1' : '#ffce8a') : `hsl(202 30% ${14 + power * 5}%)`,
        );
        svg.append(cell);
      }),
    );
    $('#frontier-spectrum').replaceChildren(svg, node('p', tr('frontierSpectrum')));
    table(
      '#frontier-signals',
      [tr('frontierBundle'), tr('frontierDrift'), tr('frontierStatus')],
      report.signals.detections.map((item) => [item.startBin, item.driftBinsPerFrame, item.label]),
    );
    $('#frontier-signals-note').textContent = report.signals.notice;
    $('#frontier-passport').textContent = `SHA-256: ${report.passportSha256}`;
    $('#frontier-ion-note').textContent = report.ion.notice;
    $('#frontier-status').textContent = tr('frontierReady');
  }
  async function run() {
    if (busy) return;
    busy = true;
    controls(true);
    resultsDisabled(true);
    $('#frontier-url').value = '';
    $('#frontier-status').textContent = tr('spaceRunning');
    try {
      const response = await fetch('/api/space/frontier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-studio-token': token },
        body: JSON.stringify({ mission: JSON.parse($('#mission').value), config: read() }),
      });
      if (!response.ok) throw Error();
      report = await response.json();
      render();
      resultsDisabled(false);
    } catch {
      $('#frontier-status').textContent = tr('frontierError');
    } finally {
      busy = false;
      controls(false);
    }
  }
  $('#frontier-run').addEventListener('click', run);
  $('#frontier-daily').addEventListener('click', () => {
    apply({ ...daily.config, locale: getLocale() });
    run();
  });
  $('#frontier-share').addEventListener('click', () => {
    $('#frontier-url').value = sharedFrontier(location.origin, report.config);
    $('#frontier-url').focus();
    $('#frontier-url').select();
  });
  $('#frontier-export').addEventListener('click', () => {
    if (report)
      download(
        JSON.stringify(report, null, 2),
        `space-passport-${report.locale}.json`,
        'application/json',
      );
  });
  $('#frontier-ion').addEventListener('click', () => {
    if (report) download(report.ion.text, `space-contacts-${report.locale}.ionrc`, 'text/plain');
  });
  $('#frontier-card').addEventListener('click', () => {
    if (!report) return;
    const index = { fr: 0, en: 1, es: 2 }[report.locale],
      text = (key, params = {}) =>
        messageTranslations[key][index].replace(/\{(\w+)\}/g, (_, name) =>
          String(params[name] ?? ''),
        );
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#101c26';
    ctx.fillRect(0, 0, 1200, 630);
    ctx.strokeStyle = '#254f53';
    for (let x = 30; x < 1200; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 630);
      ctx.stroke();
    }
    const line = (content, x, y, size, color = '#ecf4f4') => {
      ctx.font = `${size}px sans-serif`;
      ctx.fillStyle = color;
      ctx.fillText(content, x, y, 1080);
    };
    const format = (value) =>
      new Intl.NumberFormat(report.locale, { maximumFractionDigits: 2 }).format(value);
    line('FRONTIER / SPACE MISSION LAB', 60, 65, 22, '#72ebc1');
    line(report.light.label, 60, 142, 58);
    line(
      `${text('frontierRoundTrip')} · ${text('frontierDuration', { seconds: format(report.light.roundTripSeconds), years: format(report.light.roundTripSeconds / (365.25 * 86400)) })}`,
      60,
      202,
      24,
    );
    line(`${text('frontierReply')} · ${report.light.earliestReplyAt.slice(0, 10)}`, 60, 242, 24);
    line(
      text('frontierScore', {
        delivered: report.network.delivered,
        total: report.network.total,
        comparison: report.comparison.delivered,
      }),
      60,
      315,
      28,
      '#72ebc1',
    );
    line(text('frontierCandidates', { count: report.signals.candidates }), 60, 359, 24);
    line(
      `${text('frontierSeed')} · ${report.config.seed} / SHA-256 ${report.passportSha256.slice(0, 20)}…`,
      60,
      423,
      19,
      '#a9bec4',
    );
    line(text('frontierCardNote'), 60, 475, 20, '#ffce8a');
    const url = new URL(sharedFrontier(location.origin, report.config));
    line(url.origin + url.pathname, 60, 542, 18, '#72ebc1');
    line(url.search + url.hash, 60, 577, 14, '#a9bec4');
    canvas.toBlob(async (blob) => {
      if (blob) download(await blob.arrayBuffer(), `space-card-${report.locale}.png`, 'image/png');
    }, 'image/png');
  });
  try {
    const response = await fetch(`/api/space/atlas?lang=${getLocale()}`);
    if (response.ok) daily = (await response.json()).daily;
  } catch {
    /* Manual scenarios remain available. */
  }
  controls(false);
  if (validLink) await run();
}
