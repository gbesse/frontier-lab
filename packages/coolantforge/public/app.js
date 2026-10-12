import { optimizePlate, channelSvg } from '../src/index.js';
import { mount, $, element, metric, table, chart, legend, format, download } from './ui.js';
await mount({
  name: 'CoolantForge',
  analyze: optimizePlate,
  fields: [
    {
      key: 'flow',
      label: 'flow',
      min: 1,
      max: 10000,
      step: 10,
      get: (x) => x.flowMlMin,
      set: (x, v) => (x.flowMlMin = v),
    },
    {
      key: 'hotspot',
      label: 'hotspot',
      min: 1,
      max: 1000,
      step: 10,
      get: (x) => x.zones[Math.floor(x.zones.length / 2)].powerW,
      set: (x, v) => (x.zones[Math.floor(x.zones.length / 2)].powerW = v),
    },
    {
      key: 'pump',
      label: 'pumpBudget',
      min: 0.0001,
      max: 100,
      step: 0.01,
      get: (x) => x.maxPumpW,
      set: (x, v) => (x.maxPumpW = v),
    },
    {
      key: 'feature',
      label: 'feature',
      min: 0.01,
      max: 10,
      step: 0.05,
      get: (x) => x.minFeatureMm,
      set: (x, v) => (x.minFeatureMm = v),
    },
  ],
  view: ({ input, report: r, locale, m }) => {
    const f = (v) => format(v, locale);
    if (!r.best) {
      $('download-svg').disabled = true;
      return;
    }
    $('download-svg').disabled = false;
    const d = r.best;
    $('metrics').append(
      metric(m('temperature'), f(d.maxWallC)),
      metric(m('pump'), f(d.hydraulicPumpW)),
      metric(m('pressure'), f(d.pressurePa)),
    );
    const series = [
      { label: m('pareto'), points: r.pareto.map((v) => ({ x: v.hydraulicPumpW, y: v.maxWallC })) },
    ];
    $('chart').append(
      chart(series, { xLabel: m('pump'), yLabel: m('temperature'), locale, scatter: true }),
      element('h3', m('channels')),
    );
    const svg = new DOMParser().parseFromString(
      channelSvg(input, d),
      'image/svg+xml',
    ).documentElement;
    svg.setAttribute('aria-label', m('channels'));
    $('chart').append(document.importNode(svg, true));
    legend(series);
    const button = element('button', m('downloadChannels'), 'secondary');
    button.id = 'download-channels';
    button.addEventListener('click', () =>
      download(channelSvg(input, d), 'coolantforge-channels.svg', 'image/svg+xml'),
    );
    $('chart').append(button);
    $('table').append(
      table(
        [m('zone'), m('channels'), m('width'), m('flow'), m('reynolds'), m('temperature')],
        d.zones.map((z) => [
          z.id,
          z.channels,
          f(z.widthMm),
          f(z.flowMlMin),
          f(z.reynolds),
          f(z.estimatedWallC),
        ]),
      ),
    );
  },
});
