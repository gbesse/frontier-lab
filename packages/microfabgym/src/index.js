import { message } from './i18n.js';
import { requireValue, positive, nonnegative, object, finite } from './validate.js';

export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const noise = (rng) =>
  Math.sqrt(-2 * Math.log(Math.max(rng(), 1e-12))) * Math.cos(2 * Math.PI * rng());

export function validateConfig(c, locale = 'fr') {
  requireValue(
    object(c) &&
      c.schemaVersion === 1 &&
      ['synthetic', 'user'].includes(c.origin) &&
      Number.isInteger(c.seed) &&
      c.seed >= 0 &&
      c.seed <= 0xffffffff,
    locale,
  );
  requireValue(
    positive(c.targetUm) &&
      c.targetUm <= 10000 &&
      positive(c.toleranceUm) &&
      c.toleranceUm < c.targetUm &&
      nonnegative(c.sensorSigmaUm) &&
      c.sensorSigmaUm <= c.targetUm &&
      nonnegative(c.driftSigma) &&
      c.driftSigma <= 0.5,
    locale,
  );
  requireValue(
    Number.isInteger(c.episodes) &&
      c.episodes >= 1 &&
      c.episodes <= 2000 &&
      Number.isInteger(c.maxSteps) &&
      c.maxSteps >= 2 &&
      c.maxSteps <= 200 &&
      positive(c.budget) &&
      c.budget <= 100000 &&
      positive(c.measureCost) &&
      positive(c.processCost) &&
      c.measureCost <= c.budget &&
      c.processCost <= c.budget,
    locale,
  );
  return c;
}

export class MicroFabEnvironment {
  constructor(config, { locale = 'fr' } = {}) {
    this.config = validateConfig(config, locale);
    this.locale = locale;
  }
  reset(episode = 0) {
    requireValue(Number.isInteger(episode) && episode >= 0 && episode <= 1000000, this.locale);
    const c = this.config;
    // Three keyed streams prevent a policy's measurement count from changing physical noise.
    const physical = seededRandom(c.seed + episode * 7919);
    this.gain = Math.max(0.1, 1 + noise(physical) * c.driftSigma);
    this.bias = noise(physical) * c.sensorSigmaUm * 0.3;
    this.processNoise = seededRandom(c.seed + episode * 7919 + 0xabc);
    this.sensorNoise = seededRandom(c.seed + episode * 7919 + 0xdef);
    this.actual = 0;
    this.cost = 0;
    this.steps = 0;
    this.done = false;
    this.lastMeasured = null;
    this.history = [];
    this.episode = episode;
    return this.observation();
  }
  observation() {
    return {
      targetUm: this.config.targetUm,
      toleranceUm: this.config.toleranceUm,
      measuredUm: this.lastMeasured,
      remainingBudget: this.config.budget - this.cost,
      remainingSteps: this.config.maxSteps - this.steps,
      done: this.done,
    };
  }
  step(action) {
    requireValue(
      this.steps !== undefined &&
        !this.done &&
        object(action) &&
        ['deposit', 'remove', 'measure', 'finish'].includes(action.type),
      this.locale,
    );
    if (['deposit', 'remove'].includes(action.type))
      requireValue(
        finite(action.amountUm) &&
          action.amountUm > 0 &&
          action.amountUm <= this.config.targetUm * 2,
        this.locale,
      );
    const charge =
      action.type === 'measure'
        ? this.config.measureCost
        : action.type === 'finish'
          ? 0
          : this.config.processCost;
    if (this.cost + charge > this.config.budget) {
      this.done = true;
      return { observation: this.observation(), reward: -1, truncated: true, terminated: false };
    }
    this.cost += charge;
    this.steps++;
    if (action.type === 'measure')
      this.lastMeasured =
        this.actual + this.bias + noise(this.sensorNoise) * this.config.sensorSigmaUm;
    if (action.type === 'deposit' || action.type === 'remove') {
      const sign = action.type === 'deposit' ? 1 : -1;
      this.actual = Math.max(
        0,
        this.actual +
          sign * action.amountUm * this.gain +
          noise(this.processNoise) * 0.01 * action.amountUm,
      );
    }
    if (action.type === 'finish' || this.steps >= this.config.maxSteps) this.done = true;
    this.history.push({
      step: this.steps,
      action: { ...action },
      measuredUm: this.lastMeasured,
      cost: this.cost,
    });
    const success =
      this.done && Math.abs(this.actual - this.config.targetUm) <= this.config.toleranceUm;
    return {
      observation: this.observation(),
      reward: this.done
        ? (success ? 1 : -1) - (this.cost / this.config.budget) * 0.1
        : (-charge / this.config.budget) * 0.1,
      terminated: action.type === 'finish',
      truncated: this.done && action.type !== 'finish',
    };
  }
  result() {
    requireValue(this.done, this.locale);
    return {
      episode: this.episode,
      finalThicknessUm: this.actual,
      errorUm: this.actual - this.config.targetUm,
      success: Math.abs(this.actual - this.config.targetUm) <= this.config.toleranceUm,
      cost: this.cost,
      measurements: this.history.filter((h) => h.action.type === 'measure').length,
      steps: this.steps,
      trace: this.history,
    };
  }
}

export function runPolicy(config, policy, episode = 0, { locale = 'fr' } = {}) {
  const env = new MicroFabEnvironment(config, { locale });
  let obs = env.reset(episode);
  // policy sees observations only. Ground-truth quality is revealed after termination.
  for (let index = 0; !obs.done; index++) {
    requireValue(index <= config.maxSteps, locale);
    obs = env.step(policy(obs, index)).observation;
  }
  return env.result();
}

export function baselinePolicy(id, config, { locale = 'fr' } = {}) {
  if (id === 'openLoop')
    return (_, step) =>
      step === 0 ? { type: 'deposit', amountUm: config.targetUm } : { type: 'finish' };
  if (id === 'measured')
    return (o, step) => {
      if (step === 0) return { type: 'deposit', amountUm: config.targetUm * 0.75 };
      if (step % 2 === 1) return { type: 'measure' };
      const diff = o.targetUm - o.measuredUm;
      return Math.abs(diff) <= o.toleranceUm * 0.6
        ? { type: 'finish' }
        : {
            type: diff > 0 ? 'deposit' : 'remove',
            amountUm: Math.min(o.targetUm * 2, Math.abs(diff) * 0.8),
          };
    };
  if (id === 'adaptive') {
    let amount = config.targetUm * 0.7,
      gain = 1,
      previous = 0;
    return (o, step) => {
      if (step === 0) return { type: 'deposit', amountUm: amount };
      if (step % 2 === 1) return { type: 'measure' };
      if (amount !== 0)
        gain = Math.min(2, Math.max(0.2, Math.abs((o.measuredUm - previous) / amount)));
      const diff = o.targetUm - o.measuredUm;
      if (
        Math.abs(diff) <= o.toleranceUm * 0.6 ||
        o.remainingBudget < config.processCost + config.measureCost
      )
        return { type: 'finish' };
      previous = o.measuredUm;
      amount = Math.min(o.targetUm * 2, (Math.abs(diff) / gain) * 0.95);
      return { type: diff > 0 ? 'deposit' : 'remove', amountUm: amount };
    };
  }
  throw Error(message('invalidPolicy', locale));
}

export function benchmarkPolicies(config, { locale = 'fr' } = {}) {
  message('notice', locale);
  validateConfig(config, locale);
  const policies = ['openLoop', 'measured', 'adaptive'].map((id) => {
    const episodes = Array.from({ length: config.episodes }, (_, episode) =>
      runPolicy(config, baselinePolicy(id, config, { locale }), episode, { locale }),
    );
    const average = (key) => episodes.reduce((s, r) => s + r[key], 0) / episodes.length;
    return {
      id,
      label: message(id, locale),
      successRate: episodes.filter((r) => r.success).length / episodes.length,
      meanAbsoluteErrorUm: episodes.reduce((s, r) => s + Math.abs(r.errorUm), 0) / episodes.length,
      meanCost: average('cost'),
      meanMeasurements: average('measurements'),
      episodes: episodes.map(({ trace, ...r }) => r),
      example: episodes[0],
    };
  });
  return {
    schemaVersion: 1,
    locale,
    project: 'MicroFabGym',
    origin: 'synthetic',
    notice: message('notice', locale),
    summary: message('summary', locale, { count: config.episodes }),
    model: 'scalar-film-thickness/gain-drift/noisy-metrology',
    config,
    policies,
    findings: [{ code: 'simulationOnly', message: message('simulationOnly', locale) }],
  };
}
