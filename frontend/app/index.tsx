import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Platform, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore, useLevel } from "../src/store/useStore";
import { useRouter } from "expo-router";
import * as Haptics from 'expo-haptics';
import { computeChains } from "../src/gamification/chains";
import { EVENTS, getWeekRange, getCurrentWeeklyEvent, computeEventProgress } from "../src/gamification/events";
import { toKey } from "../src/utils/date";
import CelebrationOverlay from "../src/components/CelebrationOverlay";
import { predictNextStart } from "../src/utils/cycle";

function useThemeColors(theme: string) {
  if (theme === "pink_pastel") return { bg: "#fff0f5", card: "#ffe4ef", primary: "#d81b60", text: "#3a2f33", muted: "#8a6b75" };
  if (theme === "pink_vibrant") return { bg: "#1b0b12", card: "#2a0f1b", primary: "#ff2d87", text: "#ffffff", muted: "#e59ab8" };
  if (theme === "golden_pink") return { bg: "#fff8f0", card: "#ffe9c7", primary: "#dba514", text: "#2a1e22", muted: "#9b7d4e" };
  return { bg: "#fde7ef", card: "#ffd0e0", primary: "#e91e63", text: "#2a1e22", muted: "#7c5866" };
}

function getLatestWeightKg(days: Record<string, any>): number | undefined {
  const arr = Object.values(days).filter((d: any) => typeof d.weight === 'number' && d.date).sort((a: any, b: any) => String(a.date).localeCompare(String(b.date)));
  const w = arr.length ? Number(arr[arr.length - 1].weight) : undefined;
  return isNaN(w as any) ? undefined : (w as number);
}

function computeDailyWaterTargetMl(weightKg?: number, didSport?: boolean): number {
  const base = weightKg ? Math.round(weightKg * 35) : 2000;
  const sportExtra = didSport ? 500 : 0;
  return base + sportExtra; // ml
}

export default function Home() {
  const router = useRouter();
  const state = useAppStore();
  const { theme, days, eventHistory, currentDate, ensureDay, language, togglePill, incDrink, toggleFlag, setWeight } = state as any;
  const { level, xp } = useLevel();
  const colors = useThemeColors(theme);

  const prevLevelRef = useRef(level);
  const prevUnlockCountRef = useRef(state.achievementsUnlocked?.length || 0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  useEffect(() => { if (level > prevLevelRef.current) { setCelebrationText(language==='de' ? `Level ${level}` : (language==='pl'?`Poziom ${level}`:`Level ${level}`)); setShowCelebration(true); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); prevLevelRef.current = level; } }, [level]);
  useEffect(() => { const count = state.achievementsUnlocked?.length || 0; if (count > prevUnlockCountRef.current) { setCelebrationText(language==='de' ? 'Neuer Erfolg!' : (language==='pl'?'Nowe osiągnięcie!':'New achievement!')); setShowCelebration(true); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); prevUnlockCountRef.current = count; } }, [state.achievementsUnlocked]);

  useEffect(() => { ensureDay(currentDate); }, [currentDate]);

  const todayKey = toKey(new Date());
  const day = days[currentDate] || { pills: { morning: false, evening: false }, drinks: { water: 0, coffee: 0, slimCoffee: false, gingerGarlicTea: false, waterCure: false, sport: false } } as any;

  const dateLabel = React.useMemo(() => { try { const [y, m, d] = currentDate.split('-').map((n) => parseInt(n, 10)); const dt = new Date(y, m - 1, d); const locale = language === 'en' ? 'en-GB' : (language==='pl'?'pl-PL':'de-DE'); return dt.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit' }); } catch { return currentDate; } }, [currentDate, language]);

  const now = new Date();
  const { weekKey, dayKeys } = getWeekRange(now);
  const chainsAll = computeChains(state);
  // choose current chain by deterministic index tied to weekKey
  const chainIdx = Math.abs(weekKey.split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % Math.max(1, chainsAll.length);
  const currentChain = chainsAll[chainIdx];
  const evCompleted = currentChain ? currentChain.nextPercent >= 100 : false;

  const [weightModal, setWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState<string>(day?.weight ? String(day.weight) : "");
  useEffect(() => { setWeightInput(day?.weight ? String(day.weight) : ""); }, [currentDate, day?.weight]);

  const [help, setHelp] = useState<{[k:string]: boolean}>({});
  const toggleHelp = (k: string) => setHelp((h) => ({ ...h, [k]: !h[k] }));

  const t = (de: string, en: string, pl?: string) => (language === 'en' ? en : (language==='pl' && pl ? pl : de));

  // Hydration progress
  const weightKg = getLatestWeightKg(days);
  const goalMl = computeDailyWaterTargetMl(weightKg, !!day.drinks.sport);
  const intakeMl = ((state.waterCupMl || 250) * (day.drinks.water || 0)) + (day.drinks.waterCure ? 1000 : 0);
  const percent = Math.max(0, Math.min(100, Math.round((intakeMl / Math.max(1, goalMl)) * 100)));

  // Next expected cycle
  const expectedNext = predictNextStart(state.cycles);

  const topChain = useMemo(() => {
    const chains = computeChains(state);
    return chains.sort((a,b) => (b.nextPercent - a.nextPercent))[0];
  }, [state.days, state.goal, state.reminders, state.chat, state.saved, state.achievementsUnlocked, state.xp, state.language, state.theme]);

  // Weekly event (current running event from EVENTS list)
  const weeklyEvent = useMemo(() => getCurrentWeeklyEvent(new Date()), []);
  const weeklyEventProgress = useMemo(() => computeEventProgress(dayKeys, state as any, weeklyEvent), [dayKeys, state.days, state.goal, state.reminders, state.chat, state.saved, weeklyEvent.id]);

  return (
    &lt;SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}&gt;
      &lt;ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}&gt;
        {/* Header */}
        &lt;View style={[styles.headerCard, { backgroundColor: colors.card }]}&gt; 
          &lt;View style={{ alignItems: 'center' }}&gt;
            &lt;View style={{ flexDirection: 'row', alignItems: 'center' }}&gt;
              &lt;Ionicons name="star" size={18} color={colors.primary} /&gt;
              &lt;Text style={{ color: colors.text, fontWeight: '800', fontSize: 18, marginHorizontal: 8 }}&gt;{t('Scarletts Gesundheitstracking', "Scarlett’s Health Tracking", 'Zdrowie Scarlett')}&lt;/Text&gt;
              &lt;Ionicons name="star" size={18} color={colors.primary} /&gt;
            &lt;/View&gt;
            &lt;View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '70%', alignSelf: 'center', marginTop: 8 }}&gt;
              &lt;Text style={{ color: colors.text }}&gt;{t('Level', 'Level', 'Poziom')} {level}&lt;/Text&gt;
              &lt;Text style={{ color: colors.text }}&gt;{xp} XP&lt;/Text&gt;
            &lt;/View&gt;
          &lt;/View&gt;
        &lt;/View&gt;

        {/* Date navigation */}
        &lt;View style={[styles.card, { backgroundColor: colors.card }]}&gt; 
          &lt;View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}&gt;
            &lt;TouchableOpacity accessibilityLabel={t('Vortag', 'Previous day', 'Poprzedni dzień')} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); state.goPrevDay(); }} style={styles.iconBtn} &gt;
              &lt;Ionicons name="chevron-back" size={22} color={colors.text} /&gt;
            &lt;/TouchableOpacity&gt;
            &lt;TouchableOpacity accessibilityLabel={t('Heute', 'Today', 'Dziś')} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); state.goToday(); }}&gt;
              &lt;Text style={{ color: colors.text, fontWeight: '700' }}&gt;{dateLabel}&lt;/Text&gt;
            &lt;/TouchableOpacity&gt;
            &lt;TouchableOpacity accessibilityLabel={t('Folgetag', 'Next day', 'Następny dzień')} onPress={() => { const canGoNext = currentDate &lt;= toKey(new Date()); if (canGoNext) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); state.goNextDay(); } }} style={styles.iconBtn}&gt;
              &lt;Ionicons name="chevron-forward" size={22} color={colors.text} /&gt;
            &lt;/TouchableOpacity&gt;
          &lt;/View&gt;
        &lt;/View&gt;

        {/* Pills Section */}
        &lt;View style={[styles.card, { backgroundColor: colors.card }]}&gt; 
          &lt;View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}&gt;
            &lt;View style={{ flexDirection: 'row', alignItems: 'center' }}&gt;
              &lt;Ionicons name="medkit" size={20} color={colors.primary} /&gt;
              &lt;Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}&gt;
                {t('Tabletten', 'Pills', 'Tabletki')}
              &lt;/Text&gt;
            &lt;/View&gt;
          &lt;/View&gt;

          &lt;View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}&gt;
            {/* Morning Button */}
            &lt;TouchableOpacity 
              accessibilityLabel={t('Morgens einnehmen', 'Take in the morning', 'Rano zażyć')}
              onPress={() => { 
                togglePill(currentDate, 'morning'); 
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
              }} 
              style={[styles.toggle, { 
                borderColor: colors.primary, 
                backgroundColor: day.pills.morning ? colors.primary : 'transparent' 
              }]}
            &gt; 
              &lt;Ionicons 
                name="sunny" 
                size={18} 
                color={day.pills.morning ? '#fff' : colors.primary} 
              /&gt;
              &lt;Text style={{ 
                color: day.pills.morning ? '#fff' : colors.text, 
                marginLeft: 6 
              }}&gt;
                {t('Morgens', 'Morning', 'Rano')}
              &lt;/Text&gt;
            &lt;/TouchableOpacity&gt;

            {/* Evening Button */}
            &lt;TouchableOpacity 
              accessibilityLabel={t('Abends einnehmen', 'Take in the evening', 'Wieczorem zażyć')}
              onPress={() => { 
                togglePill(currentDate, 'evening'); 
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
              }} 
              style={[styles.toggle, { 
                borderColor: colors.primary, 
                backgroundColor: day.pills.evening ? colors.primary : 'transparent' 
              }]}
            &gt; 
              &lt;Ionicons 
                name="moon" 
                size={18} 
                color={day.pills.evening ? '#fff' : colors.primary} 
              /&gt;
              &lt;Text style={{ 
                color: day.pills.evening ? '#fff' : colors.text, 
                marginLeft: 6 
              }}&gt;
                {t('Abends', 'Evening', 'Wieczorem')}
              &lt;/Text&gt;
            &lt;/TouchableOpacity&gt;
          &lt;/View&gt;
        &lt;/View&gt;

        {/* Drinks &amp; Sport */}
        &lt;View style={[styles.card, { backgroundColor: colors.card }]}&gt; 
          &lt;View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}&gt;
            &lt;View style={{ flexDirection: 'row', alignItems: 'center' }}&gt;
              &lt;Ionicons name='cafe' size={18} color={colors.primary} /&gt;
              &lt;Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}&gt;{t('Getränke &amp; Sport', 'Drinks &amp; Sport', 'Napoje i sport')}&lt;/Text&gt;
            &lt;/View&gt;
            &lt;TouchableOpacity onPress={() => toggleHelp('drinks')}>&lt;Ionicons name='information-circle-outline' size={18} color={colors.muted} /&gt;&lt;/TouchableOpacity&gt;
          &lt;/View&gt;
          {help.drinks ? &lt;Text style={{ color: colors.muted, marginTop: 6 }}&gt;{t('Bechergröße in Einstellungen. Balken zeigt Ziel (35 ml/kg + 0,5 L bei Sport). Wasserkur zählt +1,0 L zur Aufnahme.', 'Set cup size in Settings. Bar shows goal (35 ml/kg + 0.5 L if sport). Water cure adds +1.0 L to intake.', 'Ustaw rozmiar kubka w ustawieniach. Pasek pokazuje cel (35 ml/kg + 0,5 L przy sporcie). Kuracja wodna dodaje +1,0 L do spożycia.')}&lt;/Text&gt; : null}

          {/* Hydration progress */}
          &lt;View style={{ marginTop: 8 }}&gt;
            &lt;View style={{ flexDirection: 'row', justifyContent: 'space-between' }}&gt;
              &lt;Text style={{ color: colors.muted }}&gt;{Math.round(intakeMl/10)/100} L&lt;/Text&gt;
              &lt;Text style={{ color: colors.muted }}&gt;{Math.round(goalMl/10)/100} L · {percent}%&lt;/Text&gt;
            &lt;/View&gt;
            &lt;View style={{ height: 8, backgroundColor: colors.bg, borderRadius: 4, overflow: 'hidden', marginTop: 6 }}&gt;
              &lt;View style={{ width: `${percent}%`, height: 8, backgroundColor: colors.primary }} /&gt;
            &lt;/View&gt;
            {day.drinks.waterCure ? (
              &lt;View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginTop: 6 }}&gt;
                &lt;View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}&gt;
                  &lt;Text style={{ color: '#fff' }}&gt;{t('Wasserkur +1,0 L', 'Water cure +1.0 L', 'Kuracja wodna +1,0 L')}&lt;/Text&gt;
                &lt;/View&gt;
              &lt;/View&gt;
            ) : null}
          &lt;/View&gt;

          {/* Water simple counter */}
          &lt;View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}&gt;
            &lt;Text style={{ color: colors.text, fontWeight: '600' }}&gt;{t('Wasser', 'Water', 'Woda')}&lt;/Text&gt;
            &lt;View style={{ flex: 1 }} /&gt;
            &lt;TouchableOpacity onPress={() => { incDrink(currentDate, 'water', -1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={[styles.counterBtnSm, { borderColor: colors.primary }]} accessibilityLabel={t('Wasser verringern', 'Decrease water', 'Zmniejsz wodę')} &gt;
              &lt;Ionicons name='remove' size={16} color={colors.primary} /&gt;
            &lt;/TouchableOpacity&gt;
            &lt;Text style={{ color: colors.text, marginHorizontal: 10, minWidth: 18, textAlign: 'center' }}&gt;{day.drinks.water}&lt;/Text&gt;
            &lt;TouchableOpacity onPress={() => { incDrink(currentDate, 'water', +1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={[styles.counterBtnSm, { borderColor: colors.primary }]} accessibilityLabel={t('Wasser erhöhen', 'Increase water', 'Zwiększ wodę')} &gt;
              &lt;Ionicons name='add' size={16} color={colors.primary} /&gt;
            &lt;/TouchableOpacity&gt;
          &lt;/View&gt;

          {/* Coffee simple counter */}
          &lt;View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}&gt;
            &lt;Text style={{ color: colors.text, fontWeight: '600' }}&gt;{t('Kaffee', 'Coffee', 'Kawa')}&lt;/Text&gt;
            &lt;View style={{ flex: 1 }} /&gt;
            &lt;TouchableOpacity onPress={() => { incDrink(currentDate, 'coffee', -1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={[styles.counterBtnSm, { borderColor: colors.primary }]} accessibilityLabel={t('Kaffee verringern', 'Decrease coffee', 'Zmniejsz kawę')} &gt;
              &lt;Ionicons name='remove' size={16} color={colors.primary} /&gt;
            &lt;/TouchableOpacity&gt;
            &lt;Text style={{ color: colors.text, marginHorizontal: 10, minWidth: 18, textAlign: 'center' }}&gt;{day.drinks.coffee}&lt;/Text&gt;
            &lt;TouchableOpacity onPress={() => { incDrink(currentDate, 'coffee', +1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={[styles.counterBtnSm, { borderColor: colors.primary }]} accessibilityLabel={t('Kaffee erhöhen', 'Increase coffee', 'Zwiększ kawę')} &gt;
              &lt;Ionicons name='add' size={16} color={colors.primary} /&gt;
            &lt;/TouchableOpacity&gt;
          &lt;/View&gt;

          {/* Toggles */}
          &lt;View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}&gt;
            &lt;TouchableOpacity onPress={() => { toggleFlag(currentDate, 'slimCoffee'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={[styles.chip, { borderColor: colors.primary, backgroundColor: day.drinks.slimCoffee ? colors.primary : 'transparent' }]} accessibilityLabel={t('Schlankkaffee', 'Slim coffee', 'Kawa fit')} &gt;
              &lt;Text style={{ color: day.drinks.slimCoffee ? '#fff' : colors.text }}&gt;{t('Schlankkaffee', 'Slim coffee', 'Kawa fit')}&lt;/Text&gt;
            &lt;/TouchableOpacity&gt;
            &lt;TouchableOpacity onPress={() => { toggleFlag(currentDate, 'gingerGarlicTea'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={[styles.chip, { borderColor: colors.primary, backgroundColor: day.drinks.gingerGarlicTea ? colors.primary : 'transparent' }]} accessibilityLabel={t('Ingwer-Knoblauch-Tee', 'Ginger &amp; garlic tea', 'Herbata imbirowo-czosnkowa')} &gt;
              &lt;Text style={{ color: day.drinks.gingerGarlicTea ? '#fff' : colors.text }}&gt;{t('Ingwer-Knoblauch-Tee', 'Ginger &amp; garlic tea', 'Herbata imbir-czosnek')}&lt;/Text&gt;
            &lt;/TouchableOpacity&gt;
            &lt;TouchableOpacity onPress={() => { toggleFlag(currentDate, 'waterCure'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={[styles.chip, { borderColor: colors.primary, backgroundColor: day.drinks.waterCure ? colors.primary : 'transparent' }]} accessibilityLabel={t('Wasserkur', 'Water cure', 'Kuracja wodna')} &gt;
              &lt;Text style={{ color: day.drinks.waterCure ? '#fff' : colors.text }}&gt;{t('Wasserkur', 'Water cure', 'Kuracja wodna')}&lt;/Text&gt;
            &lt;/TouchableOpacity&gt;
            &lt;TouchableOpacity onPress={() => { toggleFlag(currentDate, 'sport'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={[styles.chip, { borderColor: colors.primary, backgroundColor: day.drinks.sport ? colors.primary : 'transparent' }]} accessibilityLabel={t('Sport', 'Sport', 'Sport')} &gt;
              &lt;Text style={{ color: day.drinks.sport ? '#fff' : colors.text }}&gt;{t('Sport', 'Sport', 'Sport')}&lt;/Text&gt;
            &lt;/TouchableOpacity&gt;
          &lt;/View&gt;
        &lt;/View&gt;

        {/* Weight */}
        &lt;View style={[styles.card, { backgroundColor: colors.card }]}&gt; 
          &lt;View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}&gt;
            &lt;View style={{ flexDirection: 'row', alignItems: 'center' }}&gt;
              &lt;Ionicons name="fitness" size={20} color={colors.primary} /&gt;
              &lt;Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}&gt;{t('Gewicht', 'Weight', 'Waga')}&lt;/Text&gt;
            &lt;/View&gt;
            &lt;TouchableOpacity onPress={() => toggleHelp('weight')}>&lt;Ionicons name='information-circle-outline' size={18} color={colors.muted} /&gt;&lt;/TouchableOpacity&gt;
          &lt;/View&gt;
          {help.weight ? &lt;Text style={{ color: colors.muted, marginTop: 6 }}&gt;{t('Trage dein aktuelles Gewicht ein oder öffne die Analyse für Verläufe.', 'Log your current weight or open analysis for trends.', 'Zapisz bieżącą wagę lub otwórz analizę.')}&lt;/Text&gt; : null}
          &lt;View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}&gt;
            &lt;TouchableOpacity style={[styles.cta, { borderColor: colors.primary, borderWidth: 1 }]} onPress={() => setWeightModal(true)}&gt;
              &lt;Ionicons name='fitness' size={16} color={colors.text} /&gt;
              &lt;Text style={{ color: colors.text, marginLeft: 6 }}&gt;{t('Eintragen', 'Log', 'Zapisz')}&lt;/Text&gt;
            &lt;/TouchableOpacity&gt;
            &lt;TouchableOpacity style={[styles.cta, { backgroundColor: colors.primary }]} onPress={() => router.push('/analysis')} &gt;
              &lt;Ionicons name='stats-chart' size={16} color={'#fff'} /&gt;
              &lt;Text style={{ color: '#fff', marginLeft: 6 }}&gt;{t('Analyse', 'Analysis', 'Analiza')}&lt;/Text&gt;
            &lt;/TouchableOpacity&gt;
          &lt;/View&gt;
          {typeof day.weight === 'number' ? &lt;Text style={{ color: colors.muted, marginTop: 6 }}&gt;{t('Heute', 'Today', 'Dziś')}: {day.weight} kg&lt;/Text&gt; : null}
        &lt;/View&gt;

        {/* Cycle */}
        &lt;View style={[styles.card, { backgroundColor: colors.card }]}&gt; 
          &lt;View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}&gt;
            &lt;View style={{ flexDirection: 'row', alignItems: 'center' }}&gt;
              &lt;Ionicons name='water' size={20} color={colors.primary} /&gt;
              &lt;Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}&gt;{language==='de'?'Zyklus':(language==='pl'?'Cykl':'Cycle')}&lt;/Text&gt;
            &lt;/View&gt;
            &lt;TouchableOpacity onPress={() => toggleHelp('cycle')}>&lt;Ionicons name='information-circle-outline' size={18} color={colors.muted} /&gt;&lt;/TouchableOpacity&gt;
          &lt;/View&gt;
          {help.cycle ? &lt;Text style={{ color: colors.muted, marginTop: 6 }}&gt;{t('Starte/Beende deinen Zyklus. Über den Kalender erhältst du Übersicht und Prognosen.', 'Start/end your cycle. Open the calendar for overview and predictions.', 'Rozpocznij/zakończ cykl. Otwórz kalendarz dla przeglądu i prognoz.')}&lt;/Text&gt; : null}
          {expectedNext ? (
            &lt;Text style={{ color: colors.muted, marginTop: 6 }}&gt;
              {t('Nächster Zyklus erwartet am', 'Next cycle expected on', 'Następny cykl oczekiwany')} {new Date(expectedNext).toLocaleDateString(language==='en'?'en-GB':(language==='pl'?'pl-PL':'de-DE'))}
            &lt;/Text&gt;
          ) : null}
          &lt;View style={{ flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' }}&gt;
            {state.cycles.find((c: any) => !c.end) ? (
              &lt;TouchableOpacity onPress={() => { state.endCycle(currentDate); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }} style={[styles.cta, { backgroundColor: colors.primary }]}&gt;
                &lt;Ionicons name='stop' size={16} color={'#fff'} /&gt;
                &lt;Text style={{ color: '#fff', marginLeft: 6 }}&gt;{language==='de'?'Ende Periode':(language==='pl'?'Koniec okresu':'End period')}&lt;/Text&gt;
              &lt;/TouchableOpacity&gt;
            ) : (
              &lt;TouchableOpacity onPress={() => { state.startCycle(currentDate); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }} style={[styles.cta, { backgroundColor: colors.primary }]}&gt;
                &lt;Ionicons name='play' size={16} color={'#fff'} /&gt;
                &lt;Text style={{ color: '#fff', marginLeft: 6 }}&gt;{language==='de'?'Beginn Periode':(language==='pl'?'Start cyklu':'Start cycle')}&lt;/Text&gt;
              &lt;/TouchableOpacity&gt;
            )}
            &lt;TouchableOpacity onPress={() => router.push('/cycle')} style={[styles.cta, { borderColor: colors.primary, borderWidth: 1 }]}&gt;
              &lt;Ionicons name='calendar' size={16} color={colors.primary} /&gt;
              &lt;Text style={{ color: colors.text, marginLeft: 6 }}&gt;{t('Kalender', 'Calendar', 'Kalendarz')}&lt;/Text&gt;
            &lt;/TouchableOpacity&gt;
          &lt;/View&gt;
        &lt;/View&gt;

        {/* Chains */}
        &lt;View style={[styles.card, { backgroundColor: colors.card }]}&gt; 
          &lt;View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}&gt;
            &lt;View style={{ flexDirection: 'row', alignItems: 'center' }}&gt;
              &lt;Ionicons name='link' size={18} color={colors.primary} /&gt;
              &lt;Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}&gt;{language==='de'?'Ketten':(language==='pl'?'Łańcuchy':'Chains')}&lt;/Text&gt;
            &lt;/View&gt;
            &lt;TouchableOpacity onPress={() => toggleHelp('chains')}>&lt;Ionicons name='information-circle-outline' size={18} color={colors.muted} /&gt;&lt;/TouchableOpacity&gt;
          &lt;/View&gt;
          {help.chains ? &lt;Text style={{ color: colors.muted, marginTop: 6 }}&gt;{t('Ketten zeigen dir Fortschritte in Meilensteinen. Öffne Erfolge für Details.', 'Chains show progress towards milestones. Open achievements for details.', 'Łańcuchy pokazują postęp do kamieni milowych. Otwórz osiągnięcia po szczegóły.')}&lt;/Text&gt; : null}
          {topChain ? (
            &lt;View style={{ marginTop: 6 }}&gt;
              &lt;Text style={{ color: colors.muted }}&gt;{topChain.title}&lt;/Text&gt;
              &lt;View style={{ height: 6, backgroundColor: colors.bg, borderRadius: 3, overflow: 'hidden', marginTop: 6 }}&gt;
                &lt;View style={{ width: `${Math.round(topChain.nextPercent)}%`, height: 6, backgroundColor: colors.primary }} /&gt;
              &lt;/View&gt;
              {topChain.nextTitle ? &lt;Text style={{ color: colors.muted, marginTop: 4 }}&gt;{t('Als Nächstes', 'Next', 'Następne')}: {topChain.nextTitle}&lt;/Text&gt; : null}
            &lt;/View&gt;
          ) : (
            &lt;Text style={{ color: colors.muted, marginTop: 6 }}&gt;{t('Alle Ketten abgeschlossen oder keine vorhanden.', 'All chains completed or none available.', 'Wszystkie łańcuchy ukończone lub brak')}&lt;/Text&gt;
          )}
        &lt;/View&gt;

        {/* Weekly Event (current from EVENTS) */}
        &lt;View style={[styles.card, { backgroundColor: colors.card }]}&gt; 
          &lt;View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}&gt;
            &lt;View style={{ flexDirection: 'row', alignItems: 'center' }}&gt;
              &lt;Ionicons name='calendar' size={18} color={colors.primary} /&gt;
              &lt;Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}&gt;{t('Wochen-Event', 'Weekly event', 'Wydarzenie tygodnia')}&lt;/Text&gt;
            &lt;/View&gt;
            &lt;TouchableOpacity onPress={() => router.push('/events')}>&lt;Ionicons name='chevron-forward' size={18} color={colors.muted} /&gt;&lt;/TouchableOpacity&gt;
          &lt;/View&gt;
          {state.eventsEnabled === false ? (
            &lt;Text style={{ color: colors.muted, marginTop: 6 }}&gt;{t('Events sind deaktiviert (siehe Einstellungen).', 'Events are disabled (see Settings).', 'Wydarzenia są wyłączone (patrz Ustawienia).')}&lt;/Text&gt;
          ) : (
            &lt;View style={{ marginTop: 6 }}&gt;
              &lt;Text style={{ color: colors.text }}&gt;{weeklyEvent.title(language === 'en' ? 'en' : 'de')}&lt;/Text&gt;
              &lt;Text style={{ color: colors.muted, marginTop: 4 }}&gt;{weeklyEvent.description(language === 'en' ? 'en' : 'de')}&lt;/Text&gt;
              &lt;View style={{ height: 6, backgroundColor: colors.bg, borderRadius: 3, overflow: 'hidden', marginTop: 6 }}&gt;
                &lt;View style={{ width: `${weeklyEventProgress.percent}%`, height: 6, backgroundColor: weeklyEventProgress.completed ? '#2bb673' : colors.primary }} /&gt;
              &lt;/View&gt;
              &lt;Text style={{ color: colors.muted, marginTop: 4 }}&gt;{weeklyEventProgress.percent}% {weeklyEventProgress.completed ? t('abgeschlossen', 'completed', 'ukończone') : ''}&lt;/Text&gt;
            &lt;/View&gt;
          )}
        &lt;/View&gt;

        {/* Rewards */}
        &lt;View style={[styles.card, { backgroundColor: colors.card }]}&gt; 
          &lt;View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}&gt;
            &lt;View style={{ flexDirection: 'row', alignItems: 'center' }}&gt;
              &lt;Ionicons name="gift" size={20} color={colors.primary} /&gt;
              &lt;Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}&gt;{language==='de'?'Belohnungen':(language==='pl'?'Nagrody':'Rewards')}&lt;/Text&gt;
            &lt;/View&gt;
            &lt;TouchableOpacity onPress={() => toggleHelp('rewards')}>&lt;Ionicons name='information-circle-outline' size={18} color={colors.muted} /&gt;&lt;/TouchableOpacity&gt;
          &lt;/View&gt;
          {help.rewards ? (
            &lt;Text style={{ color: colors.muted, marginTop: 6 }}&gt;{t('Sammle XP, um Belohnungen freizuschalten. Sieh dir Erfolge und Rangliste an.', 'Earn XP to unlock rewards. Check achievements and leaderboard.', 'Zbieraj XP, aby odblokować nagrody. Sprawdź osiągnięcia i ranking.')}&lt;/Text&gt;
          ) : null}
          &lt;View style={{ flexDirection: 'row', gap: 12, marginTop: 10, flexWrap: 'wrap' }}&gt;
            &lt;TouchableOpacity style={[styles.cta, { backgroundColor: colors.primary }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/achievements'); }}&gt;
              &lt;Ionicons name="trophy" size={16} color="#fff" /&gt;
              &lt;Text style={{ color: '#fff', marginLeft: 6 }}&gt;{language==='de'?'Erfolge':(language==='pl'?'Osiągnięcia':'Achievements')}&lt;/Text&gt;
            &lt;/TouchableOpacity&gt;
            &lt;TouchableOpacity style={[styles.cta, { borderColor: colors.primary, borderWidth: 1 }]} onPress={() => { Haptics.impactAsync(Haptics.NotificationFeedbackType.Success); router.push('/leaderboard'); }}&gt;
              &lt;Ionicons name="podium" size={16} color={colors.primary} /&gt;
              &lt;Text style={{ color: colors.text, marginLeft: 6 }}&gt;{language==='de'?'Rangliste':(language==='pl'?'Ranking':'Leaderboard')}&lt;/Text&gt;
            &lt;/TouchableOpacity&gt;
          &lt;/View&gt;
        &lt;/View&gt;

        {/* Quick access */}
        &lt;View style={[styles.card, { backgroundColor: colors.card }]}&gt;
          &lt;View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}&gt;
            &lt;Text style={{ color: colors.text, fontWeight: '700' }}&gt;{language==='de'?'Schnellzugriff':(language==='pl'?'Szybki dostęp':'Quick access')}&lt;/Text&gt;
            &lt;TouchableOpacity onPress={() => toggleHelp('quick')}>&lt;Ionicons name='information-circle-outline' size={18} color={colors.muted} /&gt;&lt;/TouchableOpacity&gt;
          &lt;/View&gt;
          {help.quick ? &lt;Text style={{ color: colors.muted, marginTop: 6 }}&gt;{t('Schneller Zugriff auf wichtige Bereiche.', 'Quick access to key sections.', 'Szybki dostęp do ważnych sekcji.')}&lt;/Text&gt; : null}
          &lt;View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 }}&gt;
            &lt;TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/chat'); }} style={[styles.quick, { backgroundColor: colors.bg }]} accessibilityLabel='Chat'&gt;
              &lt;Ionicons name="chatbubbles" size={18} color={colors.primary} /&gt;
              &lt;Text style={{ color: colors.text, marginTop: 6 }}&gt;{language==='de'?'Chat':(language==='pl'?'Czat':'Chat')}&lt;/Text&gt;
            &lt;/TouchableOpacity&gt;
            &lt;TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/settings'); }} style={[styles.quick, { backgroundColor: colors.bg }]} accessibilityLabel='Einstellungen'&gt;
              &lt;Ionicons name="settings" size={18} color={colors.primary} /&gt;
              &lt;Text style={{ color: colors.text, marginTop: 6 }}&gt;{language==='de'?'Einstellungen':(language==='pl'?'Ustawienia':'Settings')}&lt;/Text&gt;
            &lt;/TouchableOpacity&gt;
            &lt;TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/saved'); }} style={[styles.quick, { backgroundColor: colors.bg }]} accessibilityLabel='Gespeichert'&gt;
              &lt;Ionicons name="bookmark" size={18} color={colors.primary} /&gt;
              &lt;Text style={{ color: colors.text, marginTop: 6 }}&gt;{language==='de'?'Gespeichert':(language==='pl'?'Zapisane':'Saved')}&lt;/Text&gt;
            &lt;/TouchableOpacity&gt;
            &lt;TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/faq'); }} style={[styles.quick, { backgroundColor: colors.bg }]} accessibilityLabel='FAQ'&gt;
              &lt;Ionicons name="help-circle" size={18} color={colors.primary} /&gt;
              &lt;Text style={{ color: colors.text, marginTop: 6 }}&gt;FAQ&lt;/Text&gt;
            &lt;/TouchableOpacity&gt;
          &lt;/View&gt;
        &lt;/View&gt;
      &lt;/ScrollView&gt;

      {/* Weight modal */}
      &lt;Modal visible={weightModal} transparent animationType="slide" onRequestClose={() => setWeightModal(false)}&gt;
        &lt;KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}&gt;
          &lt;View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}&gt;
            &lt;View style={{ backgroundColor: colors.card, padding: 16, borderRadius: 12, width: '88%' }}&gt;
              &lt;Text style={{ color: colors.text, fontWeight: '700' }}&gt;{t('Gewicht eintragen', 'Log weight', 'Zapisz wagę')}&lt;/Text&gt;
              &lt;View style={{ marginTop: 12 }}&gt;
                &lt;View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}&gt;
                  &lt;Ionicons name="fitness" size={18} color={colors.primary} /&gt;
                  &lt;TextInput style={{ flex: 1, marginLeft: 8, color: colors.text }} keyboardType="decimal-pad" placeholder={t('z. B. 62,3', 'e.g. 62.3', 'np. 62,3')} placeholderTextColor={colors.muted} value={weightInput} onChangeText={setWeightInput} /&gt;
                  &lt;Text style={{ color: colors.muted }}&gt;kg&lt;/Text&gt;
                &lt;/View&gt;
              &lt;/View&gt;
              &lt;View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}&gt;
                &lt;TouchableOpacity onPress={() => setWeightModal(false)} style={[styles.cta, { borderColor: colors.primary, borderWidth: 1 }]}&gt;
                  &lt;Text style={{ color: colors.text }}&gt;{t('Abbrechen', 'Cancel', 'Anuluj')}&lt;/Text&gt;
                &lt;/TouchableOpacity&gt;
                &lt;TouchableOpacity onPress={() => { const normalized = (weightInput || '').replace(',', '.'); const val = parseFloat(normalized); if (!isNaN(val) && val > 0) { setWeight(currentDate, val); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setWeightModal(false); } }} style={[styles.cta, { backgroundColor: colors.primary }]}&gt;
                  &lt;Text style={{ color: '#fff' }}&gt;{t('Speichern', 'Save', 'Zapisz')}&lt;/Text&gt;
                &lt;/TouchableOpacity&gt;
              &lt;/View&gt;
            &lt;/View&gt;
          &lt;/View&gt;
        &lt;/KeyboardAvoidingView&gt;
      &lt;/Modal&gt;

      &lt;CelebrationOverlay visible={showCelebration} message={celebrationText} onDone={() => setShowCelebration(false)} /&gt;
    &lt;/SafeAreaView&gt;
  );
}

const styles = StyleSheet.create({
  headerCard: { borderRadius: 12, padding: 16 },
  card: { borderRadius: 12, padding: 12 },
  cta: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8 },
  iconBtn: { padding: 8, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  toggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  counterBtn: { paddingHorizontal: 10, paddingVertical: 10, borderRadius: 8, borderWidth: 1, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  counterBtnSm: { paddingHorizontal: 8, paddingVertical: 8, borderRadius: 8, borderWidth: 1, minWidth: 36, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  quick: { width: '47%', borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center' },
});