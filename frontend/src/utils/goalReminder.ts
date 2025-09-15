import { scheduleOneTimeNotification, cancelNotification } from './notifications';
import type { AppState } from '../store/useStore';
import { toKey } from './date';

function nextWeekly(from: Date, targetDow: number, hour = 9, minute = 0) {
  const d = new Date(from);
  d.setHours(hour, minute, 0, 0);
  const diff = (targetDow - d.getDay() + 7) % 7;
  if (diff === 0 && +d <= +from) d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + diff);
  return d;
}

function latestWeight(days: Record<string, any>): number | undefined {
  const arr = Object.values(days).filter((d: any) => typeof d.weight === 'number' && d.date).sort((a: any, b: any) => String(a.date).localeCompare(String(b.date)));
  const w = arr.length ? Number(arr[arr.length - 1].weight) : undefined;
  return isNaN(w as any) ? undefined : (w as number);
}

// Compose body string based on pace vs plan
function buildGoalReminderBody(state: AppState): string {
  try {
    const lng = (state.language || 'de') as 'de'|'en'|'pl';
    const g = state.goal;
    if (!g || !g.active) return '';
    const startKey = g.startDate || toKey(new Date());
    const start = new Date(startKey);
    const end = new Date(g.targetDate);
    const totalDays = Math.max(1, Math.round((+end - +start)/(1000*60*60*24)));
    const todayIdx = Math.max(0, Math.min(totalDays, Math.round((+new Date(toKey(new Date())) - +start)/(1000*60*60*24))));
    const step = (g.startWeight - g.targetWeight) / totalDays;
    const plannedToday = g.startWeight - step * todayIdx;
    const cur = latestWeight(state.days);
    if (typeof cur !== 'number') return '';
    const diff = cur - plannedToday; // + = über Plan (schlechter), - = vor Plan
    const remainingKg = Math.max(0, cur - g.targetWeight);
    const daysLeft = Math.max(0, Math.round((+end - +new Date(toKey(new Date())))/(1000*60*60*24)));
    const ahead = diff <= -0.2;
    const on = Math.abs(diff) <= 0.2;
    if (lng==='en') return ahead ? `Weekly check-in: You are ahead of plan. ${remainingKg.toFixed(1)} kg left · ${daysLeft} days.` : (on ? `Weekly check-in: On plan. ${remainingKg.toFixed(1)} kg left · ${daysLeft} days.` : `Weekly check-in: Slightly behind. ${remainingKg.toFixed(1)} kg left · ${daysLeft} days.`);
    if (lng==='pl') return ahead ? `Cotygodniowy check: Jesteś przed planem. Zostało ${remainingKg.toFixed(1)} kg · ${daysLeft} dni.` : (on ? `Cotygodniowy check: Zgodnie z planem. Zostało ${remainingKg.toFixed(1)} kg · ${daysLeft} dni.` : `Cotygodniowy check: Lekko za planem. Zostało ${remainingKg.toFixed(1)} kg · ${daysLeft} dni.`);
    return ahead ? `Wöchentlicher Zielcheck: Vor dem Plan. ${remainingKg.toFixed(1)} kg übrig · ${daysLeft} Tage.` : (on ? `Wöchentlicher Zielcheck: Im Plan. ${remainingKg.toFixed(1)} kg übrig · ${daysLeft} Tage.` : `Wöchentlicher Zielcheck: Etwas hinter Plan. ${remainingKg.toFixed(1)} kg übrig · ${daysLeft} Tage.`);
  } catch { return ''; }
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
    if (meta?.id && !force) return;

    // If we need to force re-schedule, cancel previous first
    if (meta?.id && force) {
      try { await cancelNotification(meta.id); } catch {}
      state.setNotificationMeta('goal_reminder', undefined);
    }

    // schedule next reminder: same weekday as startDate at 09:00 local time
    const start = goal.startDate ? new Date(goal.startDate) : new Date();
    const dow = start.getDay();
    const next = nextWeekly(new Date(), dow, 9, 0);

    const title = state.language==='en' ? 'Goal check' : (state.language==='pl'?'Sprawdź cel':'Zielcheck');
    const body = buildGoalReminderBody(state);
    const id = await scheduleOneTimeNotification(title, body, next, 'reminders', { openRoute: '/goal' });
    if (id) state.setNotificationMeta('goal_reminder', { id });
  } catch {}
}