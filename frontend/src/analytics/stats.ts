import { DayData } from "../store/useStore";

function toSortedDays(days: Record<string, DayData>) {
  return Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
}

export function computeExtendedStats(days: Record<string, DayData>) {
  const arr = toSortedDays(days);
  // Wasser: 7/30-Tage Durchschnitt
  const lastN = (n: number) => arr.slice(-n);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const w7 = avg(lastN(7).map((d) => d.drinks?.water ?? 0));
  const w30 = avg(lastN(30).map((d) => d.drinks?.water ?? 0));

  // Gewicht: einfacher Trend (lineare Regression light: Differenz / Tage)
  const ws = arr.filter((d) => typeof d.weight === 'number');
  let weightTrendPerDay = 0;
  if (ws.length >= 2) {
    const first = ws[0].weight!;
    const last = ws[ws.length - 1].weight!;
    const daysDiff = ws.length - 1;
    weightTrendPerDay = (last - first) / daysDiff; // kg pro Tag (negativ ist gut bei Abnehmen)
  }

  // Pillen-Compliance: Anteil Tage mit morgens & abends
  const total = arr.length || 1;
  const complianceDays = arr.filter((d) => !!d.pills?.morning && !!d.pills?.evening).length;
  const complianceRate = complianceDays / total; // 0..1

  // Streaks (einfache perfekte Tage)
  function dayPerfect(d?: DayData) {
    if (!d) return false;
    const pills = !!d.pills?.morning && !!d.pills?.evening;
    const water = (d.drinks?.water ?? 0) >= 6;
    const weight = typeof d.weight === 'number';
    return pills && water && weight;
  }
  let best = 0, cur = 0;
  for (const d of arr) { if (dayPerfect(d)) { cur += 1; best = Math.max(best, cur); } else { cur = 0; } }

  return {
    waterAvg7: w7,
    waterAvg30: w30,
    weightTrendPerDay,
    complianceRate, // 0..1
    bestPerfectStreak: best,
  };
}

export function computePremiumInsights(days: Record<string, DayData>, lng: 'de'|'en') {
  const tips: string[] = [];
  const arr = toSortedDays(days);
  if (!arr.length) return tips;

  // EWMA der letzten 10 Gewichte
  const w = arr.filter((d) => typeof d.weight === 'number');
  if (w.length >= 2) {
    const alpha = 0.3;
    let ewma = w[0].weight!;
    for (let i = 1; i < w.length; i++) ewma = alpha * w[i].weight! + (1 - alpha) * ewma;
    tips.push(lng==='de' ? `Gewichts-EWMA: ${ewma.toFixed(1)} kg` : `Weight EWMA: ${ewma.toFixed(1)} kg`);

    // Kurzfristige Prognose (nächste 3 Tage aus linearem Trend)
    const first = w[0].weight!;
    const last = w[w.length - 1].weight!;
    const daysDiff = w.length - 1;
    const slope = (last - first) / Math.max(1, daysDiff);
    const forecast3 = last + slope * 3;
    tips.push(lng==='de' ? `Prognose (3 Tage): ${forecast3.toFixed(1)} kg` : `Forecast (3 days): ${forecast3.toFixed(1)} kg`);
  }

  // Ausreißer im Wasserverbrauch (±50% vom Median der letzten 14)
  const last14 = arr.slice(-14).map((d) => d.drinks?.water ?? 0);
  if (last14.length >= 5) {
    const sorted = [...last14].sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)] || 0;
    const high = last14.filter((x) => x > med * 1.5).length;
    const low = last14.filter((x) => x < med * 0.5).length;
    if (high > 0) tips.push(lng==='de' ? `Mehrere sehr hohe Trinktage (> ${(med*1.5).toFixed(1)}) erkannt.` : `Several very high water days (> ${(med*1.5).toFixed(1)}) detected.`);
    if (low > 0) tips.push(lng==='de' ? `Mehrere sehr niedrige Trinktage (< ${(med*0.5).toFixed(1)}) erkannt.` : `Several very low water days (< ${(med*0.5).toFixed(1)}) detected.`);
  }

  // Adhärenz-Score (letzte 7 Tage)
  const last7 = arr.slice(-7);
  const scoreParts = last7.map((d) => {
    let s = 0;
    s += (d.pills?.morning && d.pills?.evening) ? 40 : 0;
    s += Math.min(30, (d.drinks?.water ?? 0) * 5);
    s += typeof d.weight === 'number' ? 15 : 0;
    s += d.drinks?.sport ? 15 : 0;
    return s;
  });
  const avgScore = scoreParts.length ? Math.round(scoreParts.reduce((a,b)=>a+b,0)/scoreParts.length) : 0;
  tips.push(lng==='de' ? `Ø Adhärenz (7T): ${avgScore}/100` : `Avg adherence (7d): ${avgScore}/100`);

  return tips;
}

// --- Neue Analysen: Linearer Trend, R^2, Plateau, Korrelationen ---
export function computeWeightTrendLR(days: Record<string, DayData>, periodDays = 14) {
  const arr = toSortedDays(days).filter(d => typeof d.weight === 'number');
  const sub = arr.slice(-periodDays);
  if (sub.length < 2) return { slopePerDay: 0, r2: 0, delta: 0 };
  const n = sub.length;
  // x = 0..n-1, y = weight
  let sumX = 0, sumY = 0, sumXX = 0, sumXY = 0;
  for (let i=0;i<n;i++) { const x=i; const y=sub[i].weight!; sumX+=x; sumY+=y; sumXX+=x*x; sumXY+=x*y; }
  const denom = (n*sumXX - sumX*sumX) || 1;
  const slope = (n*sumXY - sumX*sumY) / denom;
  // r^2
  const meanY = sumY / n;
  let ssTot = 0, ssRes = 0;
  for (let i=0;i<n;i++) { const x=i; const y=sub[i].weight!; const yHat = (slope * x) + (meanY - slope * ((n-1)/2)); ssTot += (y-meanY)**2; ssRes += (y-yHat)**2; }
  const r2 = ssTot === 0 ? 0 : Math.max(0, 1 - (ssRes/ssTot));
  const delta = sub[sub.length-1].weight! - sub[0].weight!;
  return { slopePerDay: slope, r2, delta };
}

export function detectPlateau(days: Record<string, DayData>, windowDays = 7, epsilonKg = 0.1) {
  const arr = toSortedDays(days).filter(d => typeof d.weight === 'number');
  const sub = arr.slice(-windowDays);
  if (sub.length < 2) return false;
  const delta = Math.abs(sub[sub.length-1].weight! - sub[0].weight!);
  return delta < epsilonKg; // kaum Veränderung
}

export function estimateETAtoTarget(currentWeight: number|undefined, targetWeight: number|undefined, slopePerDay: number) {
  if (typeof currentWeight !== 'number' || typeof targetWeight !== 'number' || !isFinite(slopePerDay) || slopePerDay === 0) return null;
  const remaining = currentWeight - targetWeight; // kg
  const daily = Math.abs(slopePerDay);
  if (daily <= 0) return null;
  const days = Math.ceil(Math.max(0, remaining) / daily);
  const eta = new Date(); eta.setDate(eta.getDate() + days);
  return { days, eta };
}

export function computeSimpleCorrelations(days: Record<string, DayData>) {
  const arr = toSortedDays(days);
  // Hydration (Wasser) vs. ΔGewicht nächster Tag
  const water: number[] = [];
  const dWeight: number[] = [];
  for (let i=0;i<arr.length-1;i++) {
    const today = arr[i]; const next = arr[i+1];
    const cups = Number(today.drinks?.water ?? 0);
    if (typeof next.weight === 'number' && typeof today.weight === 'number') {
      water.push(cups);
      dWeight.push(next.weight - today.weight);
    }
  }
  const corr = (xs: number[], ys: number[]) => {
    const n = Math.min(xs.length, ys.length);
    if (n < 5) return 0;
    let sx=0, sy=0, sxx=0, syy=0, sxy=0;
    for (let i=0;i<n;i++){ const x=xs[i], y=ys[i]; sx+=x; sy+=y; sxx+=x*x; syy+=y*y; sxy+=x*y; }
    const cov = (sxy/n) - (sx/n)*(sy/n);
    const vx = (sxx/n) - (sx/n)**2; const vy = (syy/n) - (sy/n)**2;
    const denom = Math.sqrt(Math.max(0,vx)*Math.max(0,vy)) || 1;
    return Math.max(-1, Math.min(1, cov/denom));
  };
  const corrWaterWeight = corr(water, dWeight);

  // Sport (boolean) vs. Stimmung (same day)
  const sports: number[] = [];
  const mood: number[] = [];
  // Kaffee vs. Stimmung/Schlaf (same day)
  const coffees: number[] = [];
  const mood2: number[] = [];
  const sleep2: number[] = [];
  for (const d of arr) {
    const s = d.drinks?.sport ? 1 : 0;
    const logMood = (d as any).mood ?? undefined;
    const logSleep = (d as any).sleep ?? undefined;
    if (typeof logMood === 'number') { sports.push(s); mood.push(logMood); }
    if (typeof d.drinks?.coffee === 'number') {
      if (typeof logMood === 'number') { coffees.push(d.drinks.coffee); mood2.push(logMood); }
      if (typeof logSleep === 'number') { coffees.push(d.drinks.coffee); sleep2.push(logSleep); }
    }
  }
  const corrSportMood = corr(sports, mood);
  const corrCoffeeMood = corr(coffees.slice(0, mood2.length), mood2);
  const corrCoffeeSleep = corr(coffees.slice(0, sleep2.length), sleep2);

  return { corrWaterWeight, corrSportMood, corrCoffeeMood, corrCoffeeSleep };
}