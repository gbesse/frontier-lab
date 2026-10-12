import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
for (const locale of ['fr', 'en', 'es']) {
  test(`seven-lab tour works in ${locale}`, async () => {
    const { stdout } = await run(process.execPath, ['scripts/lab-tour.mjs', `--locale=${locale}`], {
      timeout: 180000,
    });
    const tour = JSON.parse(stdout);
    assert.equal(tour.locale, locale);
    assert.equal(tour.synthetic, true);
    assert.equal(tour.labs.length, 7);
    assert.ok(tour.labs.every((lab) => lab.summaries.every(Boolean) && lab.notices.every(Boolean)));
    assert.equal(
      tour.labs.find((lab) => lab.project === 'provenance-last-mile').summaries.length,
      1,
    );
  });
  test(`single-lab tour works in ${locale}`, async () => {
    const { stdout } = await run(
      process.execPath,
      ['scripts/lab-tour.mjs', `--locale=${locale}`, '--project=payee-exceptions'],
      { timeout: 60000 },
    );
    const tour = JSON.parse(stdout);
    assert.deepEqual(
      tour.labs.map((lab) => lab.project),
      ['payee-exceptions'],
    );
    assert.equal(tour.locale, locale);
  });
}
