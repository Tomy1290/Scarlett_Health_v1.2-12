export type Feature = { id: string; level: number; title: (lng: 'de'|'en'|'pl') => string; description: (lng: 'de'|'en'|'pl') => string };

export const FEATURES: Feature[] = [
  { id: 'goal', level: 5, title: (l)=> l==='en'?'Target weight':(l==='pl'?'Waga docelowa':'Zielgewicht'), description: (l)=> l==='en'?'Set a target weight and date.':(l==='pl'?'Ustaw wagę i datę celu.':'Lege Zielgewicht und Datum fest.') },
  { id: 'analysis', level: 10, title: (l)=> l==='en'?'Analysis':(l==='pl'?'Analiza':'Analyse'), description: (l)=> l==='en'?'Trends, plateau, correlations.':(l==='pl'?'Trendy, plateau, korelacje.':'Trends, Plateau, Korrelationen.') },
  { id: 'bmi', level: 10, title: (l)=> 'BMI', description: (l)=> l==='en'?'BMI bar and category.':(l==='pl'?'Pasek BMI i kategoria.':'BMI‑Leiste und Kategorie.') },
  { id: 'gallery', level: 15, title: (l)=> l==='en'?'Weight photo gallery':(l==='pl'?'Galeria zdjęć wagi':'Gewichts‑Galerie'), description: (l)=> l==='en'?'Attach up to 5 photos per day.':(l==='pl'?'Do 5 zdjęć dziennie.':'Bis zu 5 Fotos pro Tag.') },
  { id: 'trend_eta', level: 20, title: (l)=> l==='en'?'Trend + ETA':(l==='pl'?'Trend + ETA':'Trend + ETA'), description: (l)=> l==='en'?'Pace badges and ETA.':(l==='pl'?'Tempo i ETA.':'Pace‑Badges und ETA.') },
  { id: 'correlations', level: 30, title: (l)=> l==='en'?'Correlations':(l==='pl'?'Korelacje':'Korrelationen'), description: (l)=> l==='en'?'Hydration↔Weight, Coffee↔Mood/Sleep.':(l==='pl'?'Nawodnienie↔Waga, Kawa↔Nastrój/Sen.':'Hydration↔Gewicht, Kaffee↔Stimmung/Schlaf.') },
  { id: 'early_weigh', level: 35, title: (l)=> l==='en'?'Early-weigh tips':(l==='pl'?'Wczesne ważenie':'Frühwiege‑Tipps'), description: (l)=> l==='en'?'Guidance for morning weigh‑ins.':(l==='pl'?'Wskazówki porannego ważenia.':'Hinweise fürs Frühwiegen.') },
  { id: 'advanced_trend', level: 40, title: (l)=> l==='en'?'Advanced trend':(l==='pl'?'Zaawansowany trend':'Erweiterter Trend'), description: (l)=> l==='en'?'Extra trend details (Δ, R²).':(l==='pl'?'Dodatkowe szczegóły trendu (Δ, R²).':'Zusätzliche Trenddetails (Δ, R²).') },
  { id: 'smart_goal_reminders', level: 45, title: (l)=> l==='en'?'Smart goal reminders':(l==='pl'?'Sprytne przypomnienia celu':'Intelligente Ziel‑Reminder'), description: (l)=> l==='en'?'Pace‑aware weekly reminders.':(l==='pl'?'Przypomnienia zależne od tempa.':'Pace‑abhängige Wochen‑Reminder.') },
  { id: 'vip_chat', level: 50, title: (l)=> l==='en'?'VIP chat':(l==='pl'?'VIP czat':'VIP‑Chat'), description: (l)=> l==='en'?'Longer chat history.':(l==='pl'?'Dłuższa historia.':'Längere Verlaufshistorie.') },
  { id: 'ai_insights_plus', level: 55, title: (l)=> l==='en'?'AI insights +':(l==='pl'?'Wskazówki AI +':'KI‑Insights +'), description: (l)=> l==='en'?'More tailored suggestions.':(l==='pl'?'Bardziej dopasowane sugestie.':'Individuellere Vorschläge.') },
  { id: 'hydration_tips', level: 60, title: (l)=> l==='en'?'Hydration coaching':(l==='pl'?'Coach nawodnienia':'Hydration‑Coaching'), description: (l)=> l==='en'?'Week focus on water goal.':(l==='pl'?'Tygodniowy fokus na wodę.':'Wochenfokus aufs Wasserziel.') },
  { id: 'streak_badges', level: 65, title: (l)=> l==='en'?'Streak badges':(l==='pl'?'Odznaki serii':'Streak‑Badges'), description: (l)=> l==='en'?'Show off perfect streaks.':(l==='pl'?'Pokaż serie perfekcyjne.':'Zeige perfekte Serien.') },
  { id: 'custom_events', level: 70, title: (l)=> l==='en'?'Custom weekly goals':(l==='pl'?'Własne cele tygodniowe':'Eigene Wochenziele'), description: (l)=> l==='en'?'More flexible weekly tracking.':(l==='pl'?'Bardziej elastyczne śledzenie tygodniowe.':'Flexiblere Wochenziele.') },
  { id: 'golden_theme', level: 75, title: (l)=> l==='en'?'Golden Pink Theme':(l==='pl'?'Motyw Golden Pink':'Theme Golden Pink'), description: (l)=> l==='en'?'Exclusive theme unlocked.':(l==='pl'?'Ekskluzywny motyw.':'Exklusives Theme.') },
  { id: 'weekly_digest', level: 90, title: (l)=> l==='en'?'Weekly digest':(l==='pl'?'Tygodniowy skrót':'Wochendigest'), description: (l)=> l==='en'?'Sunday summary with highlights.':(l==='pl'?'Niedzielne podsumowanie.':'Sonntagszusammenfassung.') },
  { id: 'legend_badge', level: 100, title: (l)=> l==='en'?'Legend badge':(l==='pl'?'Odznaka Legendy':'Legenden‑Badge'), description: (l)=> l==='en'?'Show off your dedication.':(l==='pl'?'Pokaż zaangażowanie.':'Zeige dein Durchhaltevermögen.') },
];

export function getUnlocksForLevel(level: number) {
  return FEATURES.filter(f => level >= f.level).map(f => f.id);
}