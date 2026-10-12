import { orchestrate } from './orchestration.js';
import { simulate } from './simulation.js';
import { assist } from './assistant.js';
import { validateAutonomy } from './validation.js';
import { checkOptions } from './model.js';
export function runMission(mission, options = {}) {
  const settings = checkOptions(mission, options);
  const plan = orchestrate(mission, { locale: settings.locale });
  const replay = simulate(mission, plan.schedule, settings);
  const replan = orchestrate(mission, { locale: settings.locale, fault: settings.fault });
  return {
    schemaVersion: 1,
    locale: settings.locale,
    notice: replay.notice,
    missionId: mission.id,
    inputSha256: replay.inputSha256,
    plan,
    replay,
    assistant: assist(replay, replan),
    validation: validateAutonomy(mission, plan.schedule, settings),
  };
}
