export type Feature = { id: string; level: number; title: (lng: 'de'|'en'|'pl') =&gt; string; description: (lng: 'de'|'en'|'pl') =&gt; string };

export const FEATURES: Feature[] = [
  { id: 'goal', level: 5, title: (l)=&gt; l==='en'?'Target weight':(l==='pl'?'Waga docelowa':'Zielgewicht'), description: (l)=&gt; l==='en'?'Set a target weight and date.':(l==='pl'?'Ustaw wagę i datę celu.':'Lege Zielgewicht und Datum fest.') },
  { id: 'analysis', level: 10, title: (l)=&gt; l==='en'?'Analysis':(l==='pl'?'Analiza':'Analyse'), description: (l)=&gt; l==='en'?'Trends, plateau, correlations.':(l==='pl'?'Trendy, plateau, korelacje.':'Trends, Plateau, Korrelationen.') },
  { id: 'bmi', level: 10, title: (l)=&gt; 'BMI', description: (l)=&gt; l==='en'?'BMI bar and category.':(l==='pl'?'Pasek BMI i kategoria.':'BMI‑Leiste und Kategorie.') },
  { id: 'gallery', level: 15, title: (l)=&gt; l==='en'?'Weight photo gallery':(l==='pl'?'Galeria zdjęć wagi':'Gewichts‑Galerie'), description: (l)=&gt; l==='en'?'Attach up to 5 photos per day.':(l==='pl'?'Do 5 zdjęć dziennie.':'Bis zu 5 Fotos pro Tag.') },
  { id: 'trend_eta', level: 20, title: (l)=&gt; l==='en'?'Trend + ETA':(l==='pl'?'Trend + ETA':'Trend + ETA'), description: (l)=&gt; l==='en'?'Pace badges and ETA.':(l==='pl'?'Tempo i ETA.':'Pace‑Badges und ETA.') },

  // Mid-level (30–75) original
  { id: 'correlations', level: 30, title: (l)=&gt; l==='en'?'Correlations':(l==='pl'?'Korelacje':'Korrelationen'), description: (l)=&gt; l==='en'?'Hydration↔Weight, Coffee↔Mood/Sleep.':(l==='pl'?'Nawodnienie↔Waga, Kawa↔Nastrój/Sen.':'Hydration↔Gewicht, Kaffee↔Stimmung/Schlaf.') },
  { id: 'early_weigh', level: 35, title: (l)=&gt; l==='en'?'Early-weigh tips':(l==='pl'?'Wczesne ważenie':'Frühwiege‑Tipps'), description: (l)=&gt; l==='en'?'Guidance for morning weigh‑ins.':(l==='pl'?'Wskazówki porannego ważenia.':'Hinweise fürs Frühwiegen.') },
  { id: 'advanced_trend', level: 40, title: (l)=&gt; l==='en'?'Advanced trend':(l==='pl'?'Zaawansowany trend':'Erweiterter Trend'), description: (l)=&gt; l==='en'?'Extra trend details (Δ, R²).':(l==='pl'?'Dodatkowe szczegóły trendu (Δ, R²).':'Zusätzliche Trenddetails (Δ, R²).') },
  { id: 'smart_goal_reminders', level: 45, title: (l)=&gt; l==='en'?'Smart goal reminders':(l==='pl'?'Sprytne przypomnienia celu':'Intelligente Ziel‑Reminder'), description: (l)=&gt; l==='en'?'Pace‑aware weekly reminders.':(l==='pl'?'Przypomnienia zależne od tempa.':'Pace‑abhängige Wochen‑Reminder.') },
  { id: 'vip_chat', level: 50, title: (l)=&gt; l==='en'?'VIP chat':(l==='pl'?'VIP czat':'VIP‑Chat'), description: (l)=&gt; l==='en'?'Longer chat history.':(l==='pl'?'Dłuższa historia.':'Längere Verlaufshistorie.') },
  { id: 'ai_insights_plus', level: 55, title: (l)=&gt; l==='en'?'AI insights +':(l==='pl'?'Wskazówki AI +':'KI‑Insights +'), description: (l)=&gt; l==='en'?'More tailored suggestions.':(l==='pl'?'Bardziej dopasowane sugestie.':'Individuellere Vorschläge.') },
  { id: 'hydration_tips', level: 60, title: (l)=&gt; l==='en'?'Hydration coaching':(l==='pl'?'Coach nawodnienia':'Hydration‑Coaching'), description: (l)=&gt; l==='en'?'Week focus on water goal.':(l==='pl'?'Tygodniowy fokus na wodę.':'Wochenfokus aufs Wasserziel.') },
  { id: 'streak_badges', level: 65, title: (l)=&gt; l==='en'?'Streak badges':(l==='pl'?'Odznaki serii':'Streak‑Badges'), description: (l)=&gt; l==='en'?'Show off perfect streaks.':(l==='pl'?'Pokaż serie perfekcyjne.':'Zeige perfekte Serien.') },
  { id: 'custom_events', level: 70, title: (l)=&gt; l==='en'?'Custom weekly goals':(l==='pl'?'Własne cele tygodniowe':'Eigene Wochenziele'), description: (l)=&gt; l==='en'?'More flexible weekly tracking.':(l==='pl'?'Bardziej elastyczne śledzenie tygodniowe.':'Flexiblere Wochenziele.') },
  { id: 'golden_theme', level: 75, title: (l)=&gt; l==='en'?'Golden Pink Theme':(l==='pl'?'Motyw Golden Pink':'Theme Golden Pink'), description: (l)=&gt; l==='en'?'Exclusive theme unlocked.':(l==='pl'?'Ekskluzywny motyw.':'Exklusives Theme.') },

  // Mid-level (30–75) — NEW add-ons
  { id: 'photo_compare', level: 32, title: (l)=&gt; l==='en'?'Photo compare (A/B)':(l==='pl'?'Porównanie zdjęć (A/B)':'Foto‑Vergleich (A/B)'), description: (l)=&gt; l==='en'?'Compare two days side by side.':(l==='pl'?'Porównaj dwa dni obok siebie.':'Zwei Tage nebeneinander vergleichen.') },
  { id: 'export_csv', level: 34, title: (l)=&gt; l==='en'?'Export CSV':(l==='pl'?'Eksport CSV':'CSV‑Export'), description: (l)=&gt; l==='en'?'Export weight and drinks as CSV.':(l==='pl'?'Eksport wagi i napojów do CSV.':'Gewicht und Getränke als CSV exportieren.') },
  { id: 'kpi_widgets', level: 38, title: (l)=&gt; l==='en'?'Extra KPIs':(l==='pl'?'Dodatkowe KPI':'Zusätzliche KPIs'), description: (l)=&gt; l==='en'?'Show pace, ETA and delta widgets.':(l)==='pl'? 'Widżety tempa, ETA i delty.':'Widgets für Pace, ETA und Delta.' },
  { id: 'quick_add', level: 42, title: (l)=&gt; l==='en'?'Quick‑add shortcuts':(l==='pl'?'Skróty szybkiego dodawania':'Schnell‑Hinzufügen'), description: (l)=&gt; l==='en'?'Long‑press to add water or pills.':(l)==='pl'?'Długie naciśnięcie dodaje wodę/tabletki.':'Langdruck fügt Wasser/ Tabletten hinzu.' },
  { id: 'saved_tags_plus', level: 52, title: (l)=&gt; l==='en'?'Saved tips: tags+':(l==='pl'?'Zapisane porady: tagi+':'Gespeicherte Tipps: Tags+'), description: (l)=&gt; l==='en'?'Tag colors and search presets.':(l)==='pl'?'Kolory tagów i presety wyszukiwania.':'Tag‑Farben und Such‑Presets.' },
  { id: 'reminder_packs', level: 58, title: (l)=&gt; l==='en'?'Reminder packs':(l==='pl'?'Pakiety przypomnień':'Reminder‑Pakete'), description: (l)=&gt; l==='en'?'1‑tap add themed reminders.':(l)==='pl'?'Jedno stuknięcie dodaje tematyczne przypomnienia.':'Themen‑Reminder per 1‑Tap.' },
  { id: 'water_smart', level: 62, title: (l)=&gt; l==='en'?'Smart water target':(l==='pl'?'Sprytny cel wody':'Smartes Wasserziel'), description: (l)=&gt; l==='en'?'Target adapts to weight/sport.':(l)==='pl'?'Cel dostosowuje się do wagi/sportu.':'Ziel passt sich Gewicht/Sport an.' },
  { id: 'mini_challenges', level: 68, title: (l)=&gt; l==='en'?'Mini challenges':(l==='pl'?'Mini‑wyzwania':'Mini‑Challenges'), description: (l)=&gt; l==='en'?'3‑day bursts for habits.':(l)==='pl'?'3‑dniowe zrywy na nawyki.':'3‑Tage‑Sprints für Gewohnheiten.' },
  { id: 'gallery_duo', level: 72, title: (l)=&gt; l==='en'?'Gallery duo view':(l==='pl'?'Galeria duo':'Galerie Duo‑Ansicht'), description: (l)=&gt; l==='en'?'See two dates at once.':(l)==='pl'?'Zobacz dwie daty na raz.':'Zwei Daten gleichzeitig ansehen.' },
  { id: 'plateau_coach', level: 74, title: (l)=&gt; l==='en'?'Plateau coach +':(l==='pl'?'Trener plateau +':'Plateau‑Coach +'), description: (l)=&gt; l==='en'?'Action plan when progress stalls.':(l)==='pl'?'Plan działań, gdy postęp stoi.':'Aktionsplan bei Stillstand.' },

  { id: 'weekly_digest', level: 90, title: (l)=&gt; l==='en'?'Weekly digest':(l==='pl'?'Tygodniowy skrót':'Wochendigest'), description: (l)=&gt; l==='en'?'Sunday summary with highlights.':(l==='pl'?'Niedzielne podsumowanie.':'Sonntagszusammenfassung.') },
  { id: 'legend_badge', level: 100, title: (l)=&gt; l==='en'?'Legend badge':(l==='pl'?'Odznaka Legendy':'Legenden‑Badge'), description: (l)=&gt; l==='en'?'Show off your dedication.':(l==='pl'?'Pokaż zaangażowanie.':'Zeige dein Durchhaltevermögen.') },
];

export function getUnlocksForLevel(level: number) {
  return FEATURES.filter(f =&gt; level &gt;= f.level).map(f =&gt; f.id);
}