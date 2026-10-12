import { say } from './i18n.js';

export function assist(replay, replan) {
  const alerts = replay.events
    .filter((event) => event.reasons.length)
    .map((event) => ({
      code: event.reasons[0],
      title: say(event.reasons[0], replay.locale),
      sourceIds: [event.id],
      taskId: event.taskId,
      vehicleId: event.vehicleId,
      message: say('review', replay.locale, { eventId: event.id }),
      action: 'review-procedure',
    }));
  for (const finding of replay.findings) {
    if (!alerts.some((alert) => alert.sourceIds.includes(finding.sourceId)))
      alerts.push({
        code: finding.code,
        title: finding.message,
        sourceIds: [finding.sourceId],
        vehicleId: finding.vehicleId,
        message: say('review', replay.locale, { eventId: finding.sourceId }),
        action: 'review-procedure',
      });
  }
  return {
    kind: 'deterministic-rules',
    message: say(alerts.length ? 'replan' : 'healthy', replay.locale),
    alerts,
    proposal: {
      action: 'preview-replan',
      automaticallyApplied: false,
      schedule: replan.schedule,
      unassigned: replan.unassigned,
    },
  };
}
