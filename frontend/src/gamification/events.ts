import { toKey } from "../utils/date";
import { AppState } from "../store/useStore";

export type WeeklyEvent = {
  id: string;
  title: (lng: 'de'|'en') => string;
  description: (lng: 'de'|'en') => string;
  progress: (dayKeys: string[], state: Pick<AppState, 'days'|'waterCupMl'>) => number; // returns 0..100
  xp: number;
};

export function getWeekRange(date: Date) {
  const d0 = new Date(date);
  const day = d0.getDay();
  const start = new Date(d0); start.setDate(d0.getDate() - day); start.setHours(0,0,0,0);
  const days: string[] = []; for (let i=0;i<7;i++){ const di = new Date(start); di.setDate(start.getDate()+i); days.push(toKey(di)); }
  const year = start.getFullYear();
  const weekIndexInYear = Math.floor(((+start - +new Date(year,0,1)) / (1000*60*60*24)) / 7);
  const weekKey = `${year}-W${String(weekIndexInYear).padStart(2,'0')}`;
  return { weekKey, start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate()+6), dayKeys: days };
}

function countDays(dayKeys: string[], state: Pick<AppState,'days'>, pred: (d: any) => boolean) {
  let c = 0; for (const k of dayKeys) { const d = (state as any).days[k]; try { if (pred(d)) c++; } catch {} } return c;
}

function pct(hits: number, goal: number) { if (goal <= 0) return 0; const r = hits / goal; return Math.max(0, Math.min(100, Math.round(r * 100))); }

function getIntakeMl(day: any, cupMl: number) {
  const cups = Number(day?.drinks?.water ?? 0);
  const cure = day?.drinks?.waterCure ? 1000 : 0;
  return cups * Math.max(1, cupMl || 250) + cure;
}
function getGoalMl(day: any) {
  const weightKg = typeof day?.weight === 'number' ? Number(day.weight) : undefined;
  const base = weightKg ? Math.round(weightKg * 35) : 2000;
  const sport = day?.drinks?.sport ? 500 : 0;
  return base + sport;
}
function waterGoalMet(day: any, cupMl: number) {
  if (!day) return false;
  const intake = getIntakeMl(day, cupMl);
  const goal = getGoalMl(day);
  return intake >= goal;
}

// New positive-only weekly events to avoid false 100% (no "<= threshold" rules)
export const EVENTS: WeeklyEvent[] = [
  { id: 'water_4', title:(l)=> l==='de'? 'Hydration 4' : 'Hydration 4', description:(l)=> l==='de'? '4 Tage Wasserziel erreichen.' : 'Reach water goal on 4 days.', progress:(keys,s)=> pct(countDays(keys,s,(d)=> waterGoalMet(d, (s as any).waterCupMl || 250)), 4), xp: 120 },
  { id: 'pills_5', title:(l)=> l==='de'? 'Pillenfokus' : 'Pill focus', description:(l)=> l==='de'? 'An 5 Tagen morgens & abends Pillen.' : 'Morning & evening pills on 5 days.', progress:(keys,s)=> pct(countDays(keys,s,(d)=> !!d?.pills?.morning && !!d?.pills?.evening), 5), xp: 130 },
  { id: 'sport_3', title:(l)=> l==='de'? 'Sport 3' : 'Sport 3', description:(l)=> l==='de'? '3 Sporttage in dieser Woche.' : '3 sport days this week.', progress:(keys,s)=> pct(countDays(keys,s,(d)=> !!d?.drinks?.sport), 3), xp: 110 },
  { id: 'weigh_4', title:(l)=> l==='de'? 'Wiegen 4' : 'Weigh 4', description:(l)=> l==='de'? '4 Gewichtseinträge.' : 'Log weight on 4 days.', progress:(keys,s)=> pct(countDays(keys,s,(d)=> typeof d?.weight === 'number'), 4), xp: 120 },
  { id: 'water_cure_2', title:(l)=> l==='de'? 'Wasserkur 2' : 'Water cure 2', description:(l)=> l==='de'? '2x Wasserkur aktivieren.' : 'Enable water cure twice.', progress:(keys,s)=> pct(countDays(keys,s,(d)=> !!d?.drinks?.waterCure), 2), xp: 90 },
  { id: 'slim_coffee_3', title:(l)=> l==='de'? 'Abnehmkaffee 3' : 'Slim coffee 3', description:(l)=> l==='de'? '3 Tage Abnehmkaffee.' : 'Slim coffee on 3 days.', progress:(keys,s)=> pct(countDays(keys,s,(d)=> !!d?.drinks?.slimCoffee), 3), xp: 90 },
  { id: 'perfect_2', title:(l)=> l==='de'? 'Perfekter Tag ×2' : 'Perfect ×2', description:(l)=> l==='de'? '2 perfekte Tage (Pillen, Wasserziel, Gewicht).' : '2 perfect days (pills, water goal, weight).', progress:(keys,s)=> pct(countDays(keys,s,(d)=> { if(!d) return false; const p=!!d?.pills?.morning && !!d?.pills?.evening; const w=waterGoalMet(d, (s as any).waterCupMl || 250); const g=typeof d?.weight==='number'; return p && w && g; }), 2), xp: 150 },
  { id: 'weigh_early_2', title:(l)=> l==='de'? 'Früh wiegen 2' : 'Weigh early 2', description:(l)=> l==='de'? '2× vor 8:00 Uhr wiegen.' : 'Weigh before 8:00 twice.', progress:(keys,s)=> pct(countDays(keys,s,(d)=> typeof d?.weightTime==='number' && new Date(d.weightTime).getHours() < 8), 2), xp: 100 },
  { id: 'night_track_2', title:(l)=> l==='de'? 'Nachttracking 2' : 'Night tracking 2', description:(l)=> l==='de'? '2× nach 22:00 etwas tracken.' : 'Track something after 22:00 twice.', progress:(keys,s)=> pct(countDays(keys,s,(d)=> Array.isArray(d?.activityLog) && d.activityLog.some((l:any)=> new Date(l.ts).getHours()>=22)), 2), xp: 90 },
];

export function getCurrentWeeklyEvent(date: Date): WeeklyEvent {
  const { start } = getWeekRange(date);
  const idx = Math.abs((start.getFullYear()*37 + start.getMonth()*5 + start.getDate())) % EVENTS.length;
  return EVENTS[idx];
}

export function computeEventProgress(dayKeys: string[], state: Pick<AppState, 'days'|'waterCupMl'>, evt: WeeklyEvent) {
  const percent = Math.max(0, Math.min(100, Math.round(evt.progress(dayKeys, state))));
  return { percent, completed: percent >= 100 };
}