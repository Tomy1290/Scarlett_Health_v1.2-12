import { scheduleOneTimeNotification, cancelNotification } from './notifications';
import type { AppState } from '../store/useStore';

function nextWeekly(from: Date, targetDow: number, hour = 9, minute = 0) {
  const d = new Date(from);
  d.setHours(hour, minute, 0, 0);
  const diff = (targetDow - d.getDay() + 7) % 7;
  if (diff === 0 && +d &lt;= +from) d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + diff);
  return d;
}

export async function scheduleGoalReminderIfNeeded(state: AppState, force = false) {
  try {
    const goal = state.goal;
    const meta = state.notificationMeta['goal_reminder'];

    // If goal is not active, cancel any pending reminder
    if (!goal || !goal.active) {
      if (meta?.id) {
        try { await cancelNotification(meta.id); } catch {}
        state.setNotificationMeta('goal_reminder', undefined);
      }
      return;
    }

    // If we already have one and not forced, keep it
    if (meta?.id &amp;&amp; !force) return;

    // If we need to force re-schedule, cancel previous first
    if (meta?.id &amp;&amp; force) {
      try { await cancelNotification(meta.id); } catch {}
      state.setNotificationMeta('goal_reminder', undefined);
    }

    // schedule next reminder: same weekday as startDate at 09:00 local time
    const start = goal.startDate ? new Date(goal.startDate) : new Date();
    const dow = start.getDay();
    const next = nextWeekly(new Date(), dow, 9, 0);

    const title = state.language==='en' ? 'Goal check' : (state.language==='pl'?'Sprawdź cel':'Zielcheck');
    const body = '';
    const id = await scheduleOneTimeNotification(title, body, next, 'reminders');
    if (id) state.setNotificationMeta('goal_reminder', { id });
  } catch {}
}