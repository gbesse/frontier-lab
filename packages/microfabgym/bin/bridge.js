#!/usr/bin/env node
import { createInterface } from 'node:readline';
import { MicroFabEnvironment } from '../src/index.js';
import { message } from '../src/i18n.js';
let env;
for await (const line of createInterface({ input: process.stdin })) {
  try {
    const req = JSON.parse(line);
    let result;
    if (req.command === 'reset') {
      env = new MicroFabEnvironment(req.config, { locale: req.locale ?? 'en' });
      result = { observation: env.reset(req.episode ?? 0) };
    } else if (req.command === 'step' && env) {
      result = env.step(req.action);
      if (result.observation.done) result.result = env.result();
    } else throw Error(message('invalidInput', req.locale ?? 'en'));
    process.stdout.write(JSON.stringify({ ok: true, ...result }) + '\n');
  } catch (e) {
    process.stdout.write(JSON.stringify({ ok: false, error: e.message }) + '\n');
  }
}
