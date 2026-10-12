import { analyze } from '../src/index.js';
import { mount, $, element, metric, table, chart, format } from './ui.js';
function insights(report, locale, m) {
  const target = $('insights');
  target.replaceChildren();
  if (report.tests)
    for (const t of report.tests)
      for (const impact of t.impacts)
        target.append(element('p', t.id + ' : ' + impact.path.join(' → ')));
  if (report.profiles)
    target.append(
      table(
        [m('item'), m('decision'), m('detail')],
        report.profiles.flatMap((f) =>
          f.steps.map((s) => [
            f.id + ' / ' + s.id,
            m(s.state),
            s.reasons.map((k) => m(k, { fab: f.id, step: s.id })).join(' '),
          ]),
        ),
      ),
    );
  if (report.plan)
    target.append(
      table(
        [m('item'), m('decision'), m('detail')],
        report.plan.map((p) => [
          p.id,
          m(p.state),
          p.action + (p.idempotencyKey ? ' / ' + p.idempotencyKey : ''),
        ]),
      ),
    );
  if (report.feasible !== undefined)
    $('metrics').append(
      metric(m('cost'), format(report.measurementCost, locale) + ' ' + report.costUnit),
      metric(m('residual'), format(report.residualLoss, locale) + ' ' + report.costUnit),
    );
  if (report.catalog)
    target.append(
      table(
        [m('item'), m('detail')],
        report.catalog.map((b) => [
          b.id + ' @ ' + b.version,
          b.function + ' / ' + b.interfaces.map((i) => i.domain + ' [' + i.unit + ']').join(', '),
        ]),
      ),
    );
  if (report.associations?.length)
    target.append(
      table(
        [m('association'), m('riskDifference'), m('adjustedP')],
        report.associations.map((a) => [
          a.key + ' / ' + a.value,
          format(a.riskDifference * 100, locale) + ' %',
          a.adjustedPValue < 0.001
            ? a.adjustedPValue.toExponential(2)
            : format(a.adjustedPValue, locale, 4),
        ]),
      ),
    );
}
await mount({
  name: 'FabResume',
  analyze,
  fields: [
    {
      key: 'inspection',
      label: 'control',
      type: 'checkbox',
      get: (x) => x.journal.some((e) => e.type === 'inspection' && e.operationId === 'deposit'),
      set: (x, v) => {
        x.journal = x.journal.filter((e) => e.id !== 'demo-inspection');
        if (v)
          x.journal.push({
            id: 'demo-inspection',
            seq: Math.max(...x.journal.map((e) => e.seq)) + 1,
            operationId: 'deposit',
            attemptId: 'deposit-1',
            type: 'inspection',
            physicalOutcome: 'not_applied',
          });
      },
    },
  ],
  view: ({ report, locale, m }) => {
    $('metrics').append(
      metric(m('items'), String(report.rows.length)),
      metric(m('status'), m(report.status)),
    );
    $('chart').append(
      chart(
        [{ label: m('yAxis'), points: report.rows.map((r, i) => ({ x: i + 1, y: r.value })) }],
        { xLabel: m('xAxis'), yLabel: m('yAxis'), locale, scatter: true },
      ),
    );
    $('table').append(
      table(
        [m('item'), m('decision'), m('detail')],
        report.rows.map((r) => [r.id, m(r.state), r.detail]),
      ),
    );
    insights(report, locale, m);
  },
});
