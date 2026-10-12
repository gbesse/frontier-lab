import {
  runCommons,
  saveCommons,
  commonsConfigId,
  readCommonsEvidence,
} from '../packages/space-mission-lab/src/commons-engine.js';
import { dailyCommons } from '../packages/space-mission-lab/src/commons.js';
import { resolve } from 'node:path';
const directory = resolve('packages/space-mission-lab/fixtures/commons'),
  day = new Date().toISOString().slice(0, 10),
  cases = [];
for (const profile of ['iss', 'moon'])
  for (const stepSec of [10, 30, 60, 120]) cases.push(['benchmark', { profile, stepSec }]);
for (const budgetUnits of [50, 100, 200])
  for (const outage of ['none', 'paris', 'tenerife', 'canberra'])
    cases.push(['market', { budgetUnits, outage, seed: 42 }]);
for (const snr of [10, 25, 50])
  for (const maxDriftHzSec of [1, 4]) cases.push(['citizen', { snr, maxDriftHzSec }]);
for (const kind of ['benchmark', 'market', 'citizen']) cases.push([kind, dailyCommons(kind, day)]);
const seen = new Set();
for (const [kind, config] of cases) {
  const id = commonsConfigId(kind, config);
  if (process.env.SPACE_KIND && kind !== process.env.SPACE_KIND) continue;
  if (seen.has(id)) continue;
  seen.add(id);
  if (!process.argv.includes('--refresh')) {
    try {
      await readCommonsEvidence(kind, config, directory);
      console.log('REPLAY ' + id);
      continue;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  const report = await runCommons(kind, config);
  await saveCommons(report, directory);
  console.log(`${report.id} · ${report.elapsedMs} ms · ${report.evidenceSha256}`);
}
