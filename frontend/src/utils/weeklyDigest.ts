import { scheduleOneTimeNotification, cancelNotification } from './notifications';
import type { AppState } from '../store/useStore';
import { computeExtendedStats } from '../analytics/stats';

function nextWeeklyOnDow(from: Date, targetDow: number, hour = 18, minute = 0) {
  const d = new Date(from);
  d.setHours(hour, minute, 0, 0);
  const diff = (targetDow - d.getDay() + 7) % 7;
  if (diff === 0 && +d <= +from) d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + diff);
  return d;
}

function lastWeightDelta7(days: Record<string, any>) {
  const arr = Object.values(days).filter((d: any) => typeof d.weight === 'number' && d.date).sort((a: any,b: any)=> String(a.date).localeCompare(String(b.date)));
  if (arr.length < 2) return 0;
  const end = arr[arr.length - 1];
  let i = arr.length - 1;
  let j = i;
  const endDate = new Date(end.date);
  const startCut = new Date(endDate); startCut.setDate(endDate.getDate() - 7);
  while (j > 0 && new Date(arr[j].date) >= startCut) j--;
  const ref = arr[Math.max(0, j)];
  return Number(end.weight) - Number(ref.weight);
}

export async function scheduleWeeklyDigestIfNeeded(state: AppState, force = false) {
  try {
    const meta = state.notificationMeta['weekly_digest'];
    if (meta?.id && !force) return;
    if (meta?.id && force) { try { await cancelNotification(meta.id); } catch {} state.setNotificationMeta('weekly_digest', undefined); }

    const next = nextWeeklyOnDow(new Date(), 0 /* Sunday */, 18, 0);
    const stats = computeExtendedStats(state.days);
    const d7 = lastWeightDelta7(state.days);
    const lng = (state.language || 'de') as 'de'|'en'|'pl';
    const lines = {
      de: `Wochendigest: XP ${state.xp}, ΔGewicht (7T) ${d7.toFixed(1)} kg, beste Serie ${stats.bestPerfectStreak}.` ,
      en: `Weekly digest: XP ${state.xp}, Δweight (7d) ${d7.toFixed(1)} kg, best streak ${stats.bestPerfectStreak}.`,
      pl: `Tygodniowy skrót: XP ${state.xp}, Δwaga (7d) ${d7.toFixed(1)} kg, najlepsza seria ${stats.bestPerfectStreak}.`,
    } as const;
    const title = lng==='en'?'Weekly progress':(lng==='pl'?'Postępy tygodnia':'Wochenfortschritt');
    const body = (lines as any)[lng] as string;
    const id = await scheduleOneTimeNotification(title, body, next, 'reminders');
    if (id) state.setNotificationMeta('weekly_digest', { id });
  } catch {}
}