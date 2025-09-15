import { scheduleOneTimeNotification } from './notifications';
import { toKey } from './date';
import type { AppState } from '../store/useStore';

function nextWeekly(from: Date, targetDow: number, hour = 9, minute = 0) {
  const d = new Date(from);
  d.setHours(hour, minute, 0, 0);
  const diff = (targetDow - d.getDay() + 7) % 7;
  if (diff === 0 && +d <= +from) d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + diff);
  return d;
}

export async function scheduleGoalReminderIfNeeded(state: AppState) {
  try {
    const goal = state.goal;
    if (!goal || !goal.active) return;
    const meta = state.notificationMeta['goal_reminder'];
    // if there is an upcoming scheduled id, skip
    if (meta?.id) return;

    // schedule next reminder: same weekday as startDate at 09:00
    const start = goal.startDate ? new Date(goal.startDate) : new Date();
    const dow = start.getDay();
    const next = nextWeekly(new Date(), dow, 9, 0);

    const title = state.language==='en' ? 'Goal check' : (state.language==='pl'?'Sprawdź cel':'Zielcheck');
    const body = '';
    const id = await scheduleOneTimeNotification(title, body, next, 'reminders');
    if (id) state.setNotificationMeta('goal_reminder', { id });
  } catch {}
}