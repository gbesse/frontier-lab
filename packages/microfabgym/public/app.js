import { benchmarkPolicies } from '../src/index.js';
import { mount, $, metric, table, chart, legend, format } from './ui.js';
await mount({
  name: 'MicroFabGym',
  analyze: benchmarkPolicies,
  fields: [
    ...[
      ['seed', 'seed', 0, 4294967295, 1],
      ['episodes', 'episodes', 1, 2000, 1],
      ['driftSigma', 'drift', 0, 0.5, 0.01],
      ['sensorSigmaUm', 'sensor', 0, 5, 0.01],
      ['toleranceUm', 'tolerance', 0.01, 10, 0.05],
    ].map(([key, label, min, max, step]) => ({
      key,
      label,
      min,
      max,
      step,
      get: (x) => x[key],
      set: (x, v) => (x[key] = v),
    })),
  ],
  view: ({ report: r, locale, m }) => {
    const f = (v) => format(v, locale);
    const best = r.policies[2];
    $('metrics').append(
      metric(m('yield'), f(best.successRate * 100)),
      metric(m('cost'), f(best.meanCost)),
      metric(m('measurements'), f(best.meanMeasurements)),
    );
    const series = r.policies.map((p) => ({
      label: p.label,
      points: p.episodes.map((e) => ({ x: e.episode + 1, y: e.errorUm })),
    }));
    $('chart').append(
      chart(series, { xLabel: m('xAxis'), yLabel: m('yAxis'), locale, scatter: true }),
    );
    legend(series);
    $('table').append(
      table(
        [m('policy'), m('yield'), m('error'), m('cost'), m('measurements')],
        r.policies.map((p) => [
          p.label,
          f(p.successRate * 100),
          f(p.meanAbsoluteErrorUm),
          f(p.meanCost),
          f(p.meanMeasurements),
        ]),
      ),
    );
  },
});
