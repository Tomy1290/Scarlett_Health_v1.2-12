export type Feature = { id: string; level: number; title: (lng: 'de'|'en'|'pl') => string; description: (lng: 'de'|'en'|'pl') => string };

export const FEATURES: Feature[] = [
  { id: 'goal', level: 5, title: (l)=> l==='en'?'Target weight':(l==='pl'?'Waga docelowa':'Zielgewicht'), description: (l)=> l==='en'?'Set a target weight and date.':(l==='pl'?'Ustaw wagę i datę celu.':'Lege Zielgewicht und Datum fest.') },
  { id: 'analysis', level: 10, title: (l)=> l==='en'?'Analysis':(l==='pl'?'Analiza':'Analyse'), description: (l)=> l==='en'?'Trends, plateau, correlations.':(l==='pl'?'Trendy, plateau, korelacje.':'Trends, Plateau, Korrelationen.') },
  { id: 'gallery', level: 15, title: (l)=> l==='en'?'Weight photo gallery':(l==='pl'?'Galeria zdjęć wagi':'Gewichts‑Galerie'), description: (l)=> l==='en'?'Attach up to 5 photos per day.':(l==='pl'?'Do 5 zdjęć dziennie.':'Bis zu 5 Fotos pro Tag.') },
  { id: 'trend_eta', level: 20, title: (l)=> l==='en'?'Trend + ETA':(l==='pl'?'Trend + ETA':'Trend + ETA'), description: (l)=> l==='en'?'Pace badges and ETA.':(l==='pl'?'Tempo i ETA.':'Pace‑Badges und ETA.') },
  { id: 'correlations', level: 30, title: (l)=> l==='en'?'Correlations':(l==='pl'?'Korelacje':'Korrelationen'), description: (l)=> l==='en'?'Hydration↔Weight, Coffee↔Mood/Sleep.':(l==='pl'?'Nawodnienie↔Waga, Kawa↔Nastrój/Sen.':'Hydration↔Gewicht, Kaffee↔Stimmung/Schlaf.') },
  { id: 'bmi', level: 10, title: (l)=> 'BMI', description: (l)=> l==='en'?'BMI bar and category.':(l==='pl'?'Pasek BMI i kategoria.':'BMI‑Leiste und Kategorie.') },
  { id: 'golden_theme', level: 75, title: (l)=> l==='en'?'Golden Pink Theme':(l==='pl'?'Motyw Golden Pink':'Theme Golden Pink'), description: (l)=> l==='en'?'Exclusive theme unlocked.':(l==='pl'?'Ekskluzywny motyw.':'Exklusives Theme.') },
  { id: 'weekly_digest', level: 90, title: (l)=> l==='en'?'Weekly digest':(l==='pl'?'Tygodniowy skrót':'Wochendigest'), description: (l)=> l==='en'?'Sunday summary with highlights.':(l==='pl'?'Niedzielne podsumowanie.':'Sonntagszusammenfassung.') },
  { id: 'legend_badge', level: 100, title: (l)=> l==='en'?'Legend badge':(l==='pl'?'Odznaka Legendy':'Legenden‑Badge'), description: (l)=> l==='en'?'Show off your dedication.':(l==='pl'?'Pokaż zaangażowanie.':'Zeige dein Durchhaltevermögen.') },
];

export function getUnlocksForLevel(level: number) {
  return FEATURES.filter(f => level >= f.level).map(f => f.id);
}