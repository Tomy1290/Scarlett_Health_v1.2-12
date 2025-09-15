import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '../src/store/useStore';

function useThemeColors(theme: string) {
  if (theme === 'pink_pastel') return { bg: '#fff0f5', card: '#ffe4ef', primary: '#d81b60', text: '#3a2f33', muted: '#8a6b75' };
  if (theme === 'pink_vibrant') return { bg: '#1b0b12', card: '#2a0f1b', primary: '#ff2d87', text: '#ffffff', muted: '#e59ab8' };
  if (theme === 'golden_pink') return { bg: '#fff8f0', card: '#ffe9c7', primary: '#dba514', text: '#2a1e22', muted: '#9b7d4e' };
  return { bg: '#fde7ef', card: '#ffd0e0', primary: '#e91e63', text: '#2a1e22', muted: '#7c5866' };
}

export default function FAQ() {
  const state = useAppStore();
  const router = useRouter();
  const colors = useThemeColors(state.theme);

  const t = (key: string) =&gt; {
    const de: Record&lt;string,string&gt; = {
      title: 'FAQ &amp; Hilfe',
      q1: 'Wie funktioniert das Level‑System?',
      a1: 'Du sammelst XP für Einträge, Ketten und Events. Ab Stufe 30–75 schaltest du viele Extras frei (Korrelationen, Foto‑Vergleich, CSV‑Export, Smart‑Reminder, Mini‑Challenges, Golden‑Pink‑Theme u. v. m.).',
      q2: 'Wofür sind die neuen Freischaltungen?',
      a2: 'Zwischen Level 30 und 75 bekommst du: Korrelationen, Frühwiege‑Tipps, erweiterte Trend‑Details, pace‑abhängige Ziel‑Reminder, VIP‑Chat, AI‑Insights+, Hydration‑Coaching, Streak‑Badges, eigene Wochenziele, Golden‑Pink‑Theme sowie Extras wie Foto A/B, CSV‑Export, Extra‑KPIs, Schnellzugriff, Tag‑Farben, Reminder‑Pakete, Smart‑Wasserziel, Mini‑Challenges, Galerie‑Duo und Plateau‑Coach.',
      q3: 'Galerie: Wie groß dürfen Fotos sein?',
      a3: 'Bilder werden beim Hinzufügen komprimiert. Maximal 5 Fotos pro Tag. Oben siehst du die Gesamtspeichergröße.',
      q4: 'Wie wähle ich die Sprache?',
      a4: 'In den Einstellungen tippst du einfach auf eine Flagge (DE, EN, PL).',
      q5: 'Arbeitet die App offline?',
      a5: 'Ja. Die wichtigsten Funktionen funktionieren offline. Online‑Funktionen wie KI‑Tipps nutzen das Backend, wenn Internet verfügbar ist.',
      q6: 'Benachrichtigungen (HyperOS/MIUI)',
      a6: 'Auf HyperOS/MIUI nutzen wir Sekunden‑Trigger, um zu frühes Auslösen zu vermeiden. Stelle sicher, dass die App vom Energiesparen ausgenommen ist.',
    };
    const en: Record&lt;string,string&gt; = {
      title: 'FAQ &amp; Help',
      q1: 'How does leveling work?',
      a1: 'You earn XP for entries, streaks and events. From levels 30–75 you unlock many extras (correlations, photo compare, CSV export, smart reminders, mini‑challenges, Golden‑Pink theme, and more).',
      q2: 'What are the new mid‑level unlocks for?',
      a2: 'Between levels 30 and 75 you get: correlations, early‑weigh tips, advanced trend details, pace‑aware goal reminders, VIP chat, AI Insights+, hydration coaching, streak badges, custom weekly goals, Golden‑Pink theme, plus add‑ons like Photo A/B, CSV export, extra KPIs, quick‑add, tag colors, reminder packs, smart water target, mini‑challenges, gallery duo, and plateau coach.',
      q3: 'Gallery: How big can photos be?',
      a3: 'Photos are compressed on add. Up to 5 per day. The header shows total storage used.',
      q4: 'How do I choose language?',
      a4: 'In Settings, tap a flag (DE, EN, PL).',
      q5: 'Does the app work offline?',
      a5: 'Yes. Core features work offline. Online features like AI tips use the backend when connected.',
      q6: 'Notifications (HyperOS/MIUI)',
      a6: 'On HyperOS/MIUI we use seconds‑based triggers to avoid early firing. Please exclude the app from battery optimizations.',
    };
    const pl: Record&lt;string,string&gt; = {
      title: 'FAQ i pomoc',
      q1: 'Jak działa system poziomów?',
      a1: 'Zdobywasz XP za wpisy, serie i wydarzenia. Od poziomów 30–75 odblokujesz wiele dodatków (korelacje, porównanie zdjęć, eksport CSV, sprytne przypomnienia, mini‑wyzwania, motyw Golden‑Pink i więcej).',
      q2: 'Po co są nowe odblokowania?',
      a2: 'Między poziomami 30 a 75 otrzymujesz: korelacje, wskazówki wczesnego ważenia, zaawansowane szczegóły trendu, przypomnienia celu zależne od tempa, VIP‑czat, AI Insights+, coaching nawodnienia, odznaki serii, własne cele tygodniowe, motyw Golden‑Pink oraz dodatki: Foto A/B, eksport CSV, dodatkowe KPI, szybkie dodawanie, kolory tagów, pakiety przypomnień, sprytny cel wody, mini‑wyzwania, widok duo w galerii i trener plateau.',
      q3: 'Galeria: jak duże mogą być zdjęcia?',
      a3: 'Zdjęcia są kompresowane przy dodawaniu. Maks. 5 dziennie. W nagłówku widzisz łączny rozmiar.',
      q4: 'Jak wybrać język?',
      a4: 'W Ustawieniach stuknij flagę (DE, EN, PL).',
      q5: 'Czy aplikacja działa offline?',
      a5: 'Tak. Kluczowe funkcje działają offline. Funkcje online jak wskazówki AI używają backendu przy połączeniu.',
      q6: 'Powiadomienia (HyperOS/MIUI)',
      a6: 'Na HyperOS/MIUI używamy wyzwalaczy sekundowych, by uniknąć zbyt wczesnego wywołania. Wyłącz optymalizacje baterii dla aplikacji.',
    };
    const map = state.language==='en'?en:(state.language==='pl'?pl:de);
    return map[key] || key;
  };

  const items = [
    { q: 'q1', a: 'a1' },
    { q: 'q2', a: 'a2' },
    { q: 'q3', a: 'a3' },
    { q: 'q4', a: 'a4' },
    { q: 'q5', a: 'a5' },
    { q: 'q6', a: 'a6' },
  ];

  return (
    &lt;SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}&gt;
      &lt;View style={[styles.header, { backgroundColor: colors.card }]}&gt; 
        &lt;TouchableOpacity onPress={() =&gt; router.back()} style={{ padding: 8 }}&gt;
          &lt;Ionicons name='chevron-back' size={24} color={colors.text} /&gt;
        &lt;/TouchableOpacity&gt;
        &lt;Text style={{ color: colors.text, fontWeight: '800' }}&gt;{t('title')}&lt;/Text&gt;
        &lt;View style={{ width: 40 }} /&gt;
      &lt;/View&gt;

      &lt;ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}&gt;
        {items.map((it, idx) =&gt; (
          &lt;View key={idx} style={[styles.card, { backgroundColor: colors.card }]}&gt;
            &lt;Text style={{ color: colors.text, fontWeight: '700' }}&gt;{t(it.q)}&lt;/Text&gt;
            &lt;Text style={{ color: colors.muted, marginTop: 6 }}&gt;{t(it.a)}&lt;/Text&gt;
          &lt;/View&gt;
        ))}
      &lt;/ScrollView&gt;
    &lt;/SafeAreaView&gt;
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { borderRadius: 12, padding: 12 },
});