import { compareRevisions, measurementsFromCsv } from '../src/index.js';
import { mount, $, element, metric, table, chart, legend, format } from './ui.js';
await mount({
  name: 'FabReplay',
  analyze: compareRevisions,
  fields: [
    {
      key: 'minimum',
      label: 'minimum',
      min: 0.01,
      max: 100000,
      step: 0.1,
      get: (x) => x.minimumStiffnessNPerM,
      set: (x, v) => (x.minimumStiffnessNPerM = v),
    },
    {
      key: 'calibration',
      label: 'changedConditions',
      type: 'checkbox',
      get: (x) => x.revisions[0].conditions.calibration !== x.revisions[1].conditions.calibration,
      set: (x, v) =>
        (x.revisions[1].conditions.calibration = v
          ? x.revisions[0].conditions.calibration + '-changed'
          : x.revisions[0].conditions.calibration),
    },
  ],
  view: ({ input, report: r, locale, m }) => {
    const f = (v) => format(v, locale);
    $('metrics').append(
      metric(m('change'), f(r.changePercent)),
      metric(m('measuredValue'), f(r.candidate.meanStiffnessNPerM)),
      metric(m('minimum'), f(r.minimumStiffnessNPerM)),
    );
    const series = input.revisions.map((rev) => ({
      label: rev.id,
      points: [...rev.measurements]
        .sort((a, b) => a.displacementUm - b.displacementUm)
        .map((p) => ({ x: p.displacementUm, y: p.forceMn })),
    }));
    $('chart').append(
      chart(series, { xLabel: m('xAxis'), yLabel: m('yAxis'), locale, scatter: true }),
    );
    legend(series);
    $('table').append(
      table(
        [
          m('revision'),
          m('predicted'),
          m('measuredValue'),
          m('confidence'),
          m('residual'),
          m('specimens'),
        ],
        [r.baseline, r.candidate].map((v) => [
          v.id,
          f(v.predictedStiffnessNPerM),
          f(v.meanStiffnessNPerM),
          v.confidence95NPerM.map(f).join(' – '),
          f(v.residualPercent),
          v.specimenCount,
        ]),
      ),
    );
  },
  extra: ({ input, m, replace, locale }) => {
    $('extra-input').replaceChildren(element('p', m('csvHelp')));
    for (const [index, key] of ['csvBaseline', 'csvCandidate'].entries()) {
      const label = element('label', m(key)),
        file = element('input');
      file.type = 'file';
      file.accept = '.csv,text/csv';
      file.id = 'csv-' + index;
      file.addEventListener('change', async () => {
        try {
          const selected = file.files[0];
          if (!selected) return;
          if (selected.size > 5000000) throw Error(m('invalidInput'));
          const current = JSON.parse($('input').value);
          current.revisions[index].measurements = measurementsFromCsv(await selected.text(), {
            locale,
          });
          replace(current);
        } catch (e) {
          $('status').textContent = e.message;
          $('status').className = 'error';
        }
      });
      const button = element('button', m('selectFile'), 'secondary');
      button.type = 'button';
      button.addEventListener('click', () => file.click());
      file.hidden = true;
      label.append(file, button);
      $('extra-input').append(label);
    }
  },
});
