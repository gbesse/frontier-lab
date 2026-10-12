import { checkOptions } from './model.js';
import { simulate } from './simulation.js';
import { say } from './i18n.js';

export function orchestrate(mission, options = {}) {
  const { locale, fault } = checkOptions(mission, options);
  const schedule = [],
    unassigned = [];
  const tasks = [...mission.tasks].sort(
    (a, b) => b.priority - a.priority || a.id.localeCompare(b.id, 'en'),
  );
  for (const task of tasks) {
    let candidate = null;
    for (let start = task.start; start <= task.end - task.duration && !candidate; start++) {
      for (const vehicleId of [...task.vehicleIds].sort()) {
        const proposed = [...schedule, { taskId: task.id, vehicleId, start }];
        const result = simulate(mission, proposed, { locale, fault, policy: 'guarded' });
        if (result.safe && result.completed.length === proposed.length) {
          candidate = proposed.at(-1);
          break;
        }
      }
    }
    if (candidate) schedule.push(candidate);
    else
      unassigned.push({ taskId: task.id, code: 'unassigned', message: say('unassigned', locale) });
  }
  schedule.sort(
    (a, b) =>
      a.start - b.start ||
      a.vehicleId.localeCompare(b.vehicleId, 'en') ||
      a.taskId.localeCompare(b.taskId, 'en'),
  );
  return {
    method: 'greedy-priority-first',
    schedule,
    unassigned,
    priorityScore: schedule.reduce(
      (sum, item) => sum + mission.tasks.find((task) => task.id === item.taskId).priority,
      0,
    ),
  };
}
