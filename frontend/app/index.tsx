import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Platform, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppStore, useLevel } from "../src/store/useStore";
import { useRouter } from "expo-router";
import * as Haptics from 'expo-haptics';
import { computeChains } from "../src/gamification/chains";
import { getWeekRange, getCurrentWeeklyEvent, computeEventProgress } from "../src/gamification/events";
import { toKey } from "../src/utils/date";
import CelebrationOverlay from "../src/components/CelebrationOverlay";
import { predictNextStart } from "../src/utils/cycle";
import { onlineMotivation } from "../src/ai/online";
import { computeWeightTrendLR, estimateETAtoTarget, computeBMI } from "../src/analytics/stats";
import BMIBar from "../src/components/BMIBar";

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
  const { theme, days, currentDate, ensureDay, language, togglePill, incDrink, toggleFlag, setWeight } = state as any;
  const { level, xp } = useLevel();
  const colors = useThemeColors(theme);

  const prevLevelRef = useRef(level);
  const prevUnlockCountRef = useRef(state.achievementsUnlocked?.length || 0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  useEffect(() => { if (level > prevLevelRef.current) { setCelebrationText(language==='de' ? `Level ${level}` : (language==='pl'?`Poziom ${level}`:`Level ${level}`)); setShowCelebration(true); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); prevLevelRef.current = level; } }, [level]);
  useEffect(() => { const count = state.achievementsUnlocked?.length || 0; if (count > prevUnlockCountRef.current) { setCelebrationText(language==='de' ? 'Neuer Erfolg!' : (language==='pl'?'Nowe osiągnięcie!':'New achievement!')); setShowCelebration(true); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); prevUnlockCountRef.current = count; } }, [state.achievementsUnlocked]);

  useEffect(() => { ensureDay(currentDate); }, [currentDate]);

  const day = days[currentDate] || { pills: { morning: false, evening: false }, drinks: { water: 0, coffee: 0, slimCoffee: false, gingerGarlicTea: false, waterCure: false, sport: false } } as any;

  const dateLabel = React.useMemo(() => { try { const [y, m, d] = currentDate.split('-').map((n) => parseInt(n, 10)); const dt = new Date(y, m - 1, d); const locale = language === 'en' ? 'en-GB' : (language==='pl'?'pl-PL':'de-DE'); return dt.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit' }); } catch { return currentDate; } }, [currentDate, language]);

  const now = new Date();
  const { dayKeys } = getWeekRange(now);

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

  // Weekly event
  const weeklyEvent = useMemo(() => getCurrentWeeklyEvent(new Date()), []);
  const weeklyEventProgress = useMemo(() => computeEventProgress(dayKeys, state as any, weeklyEvent), [dayKeys, state.days, weeklyEvent.id]);

  // Motivation line (short)
  const [motivation, setMotivation] = useState<string>('');
  useEffect(() => {
    let active = true;
    (async () => {
      try { if (!state.aiInsightsEnabled) return; const m = await onlineMotivation(state as any); if (active) setMotivation(m); } catch { if (active) setMotivation(''); } 
    })();
    return () => { active = false; };
  }, [state.language, state.days, state.goal, weeklyEvent.id]);

  const weeklyEventProgressState = weeklyEventProgress;
  // Show motivation only for weight-related weekly events
  const isWeightEvent = weeklyEvent && (weeklyEvent.id === 'weigh_4' || weeklyEvent.id === 'weigh_early_2' || weeklyEvent.id === 'perfect_2');

  // Pace/ETA inline under weight card
  const trend = useMemo(() => computeWeightTrendLR(state.days, 14), [state.days]);
  const etaObj = useMemo(() => {
    const g = state.goal;
    if (!g || !g.active) return null;
    const latest = getLatestWeightKg(state.days);
    return estimateETAtoTarget(latest, g.targetWeight, trend.slopePerDay || 0);
  }, [state.goal, state.days, trend.slopePerDay]);

  function paceState() {
    const g = state.goal; if (!g || !g.active) return 'none' as const;
    const start = new Date(g.startDate || toKey(new Date()));
    const end = new Date(g.targetDate);
    const totalDays = Math.max(1, Math.round((+end - +start)/(1000*60*60*24)));
    const todayIdx = Math.max(0, Math.min(totalDays, Math.round((+new Date(toKey(new Date())) - +start)/(1000*60*60*24))));
    const step = (g.startWeight - g.targetWeight) / totalDays;
    const plannedToday = g.startWeight - step * todayIdx;
    const cur = getLatestWeightKg(state.days);
    if (typeof cur !== 'number') return 'none' as const;
    const diff = cur - plannedToday;
    if (diff <= -0.2) return 'ahead' as const;
    if (Math.abs(diff) <= 0.2) return 'on' as const;
    return 'behind' as const;
  }
  function paceLabel() {
    const g = state.goal; if (!g || !g.active) return '';
    const start = new Date(g.startDate || toKey(new Date()));
    const end = new Date(g.targetDate);
    const totalDays = Math.max(1, Math.round((+end - +start)/(1000*60*60*24)));
    const todayIdx = Math.max(0, Math.min(totalDays, Math.round((+new Date(toKey(new Date())) - +start)/(1000*60*60*24))));
    const step = (g.startWeight - g.targetWeight) / totalDays;
    const plannedToday = g.startWeight - step * todayIdx;
    const cur = getLatestWeightKg(state.days);
    if (typeof cur !== 'number') return '';
    const diff = cur - plannedToday;
    if (diff <= -0.2) return t('Vor dem Plan', 'Ahead of plan', 'Przed planem');
    if (Math.abs(diff) <= 0.2) return t('Im Plan', 'On plan', 'Zgodnie z planem');
    return t('Hinter dem Plan', 'Behind plan', 'Za planem');
  }

  const latestWeight = getLatestWeightKg(days);
  const bmiVal = computeBMI(state.heightCm as any, latestWeight as any);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* Header */}
        <View style={[styles.headerCard, { backgroundColor: colors.card }]}> 
          <View style={{ alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="star" size={18} color={colors.primary} />
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18, marginHorizontal: 8 }}>{t('Scarletts Gesundheitstracking', "Scarlett’s Health Tracking", 'Zdrowie Scarlett')}</Text>
              <Ionicons name="star" size={18} color={colors.primary} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '70%', alignSelf: 'center', marginTop: 8 }}>
              <Text style={{ color: colors.text }}>{t('Level', 'Level', 'Poziom')} {level}</Text>
              <Text style={{ color: colors.text }}>{xp} XP</Text>
            </View>
          </View>
        </View>

        {/* Date navigation */}
        <View style={[styles.card, { backgroundColor: colors.card }]}> 
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity accessibilityLabel={t('Vortag', 'Previous day', 'Poprzedni dzień')} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); state.goPrevDay(); }} style={styles.iconBtn} >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity accessibilityLabel={t('Heute', 'Today', 'Dziś')} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); state.goToday(); }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{dateLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityLabel={t('Folgetag', 'Next day', 'Następny dzień')} onPress={() => { const canGoNext = currentDate <= toKey(new Date()); if (canGoNext) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); state.goNextDay(); } }} style={styles.iconBtn}>
              <Ionicons name="chevron-forward" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pills Section */}
        <View style={[styles.card, { backgroundColor: colors.card }]}> 
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="pill" size={20} color={colors.primary} />
              <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}>
                {t('Tabletten', 'Pills', 'Tabletki')}
              </Text>
            </View>
            <TouchableOpacity onPress={() => toggleHelp('pills')}><Ionicons name='information-circle-outline' size={18} color={colors.muted} /></TouchableOpacity>
          </View>
          {help.pills ? (
            <Text style={{ color: colors.muted, marginTop: 6 }}>
              {t('Tippe auf Morgens/Abends um die Einnahme zu markieren. Du erhältst XP für vollständige Tage und Kettenfortschritte.', 'Tap Morning/Evening to mark your intake. You gain XP for complete days and chain progress.', 'Stuknij Rano/Wieczorem, aby zaznaczyć przyjęcie. Zdobywasz XP za pełne dni i postęp łańcucha.')}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
            {/* Morning Button */}
            ...
          </View>
        </View>

        {/* Drinks & Sport */}
        ...

        {/* Weight */}
        <View style={[styles.card, { backgroundColor: colors.card }]}> 
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="fitness" size={20} color={colors.primary} />
              <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}>{t('Gewicht', 'Weight', 'Waga')}</Text>
            </View>
            <TouchableOpacity onPress={() => toggleHelp('weight')}><Ionicons name='information-circle-outline' size={18} color={colors.muted} /></TouchableOpacity>
          </View>
          {help.weight ? <Text style={{ color: colors.muted, marginTop: 6 }}>{t('Trage dein aktuelles Gewicht ein oder öffne die Analyse für Verläufe.', 'Log your current weight or open analysis for trends.', 'Zapisz bieżącą wagę lub otwórz analizę.')}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity style={[styles.cta, { borderColor: colors.primary, borderWidth: 1 }]} onPress={() => setWeightModal(true)}>
              <Ionicons name='fitness' size={16} color={colors.text} />
              <Text style={{ color: colors.text, marginLeft: 6 }}>{t('Eintragen', 'Log', 'Zapisz')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cta, { backgroundColor: colors.primary }]} onPress={() => router.push('/analysis')} >
              <Ionicons name='stats-chart' size={16} color={'#fff'} />
              <Text style={{ color: '#fff', marginLeft: 6 }}>{t('Analyse', 'Analysis', 'Analiza')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cta, { borderColor: colors.primary, borderWidth: 1 }]} onPress={() => router.push('/goal')}>
              <Ionicons name='flag' size={16} color={colors.primary} />
              <Text style={{ color: colors.text, marginLeft: 6 }}>Zielgewicht</Text>
            </TouchableOpacity>
          </View>
          {typeof day.weight === 'number' ? <Text style={{ color: colors.muted, marginTop: 6 }}>{t('Heute', 'Today', 'Dziś')}: {day.weight} kg</Text> : null}
          {/* BMI bar */}
          {typeof bmiVal === 'number' ? (
            <View style={{ marginTop: 6 }}>
              <BMIBar bmi={bmiVal} language={language as any} textColor={colors.text} />
            </View>
          ) : null}
          {state.aiInsightsEnabled && !!motivation ? (
            <Text style={{ color: colors.text, marginTop: 6 }}>{motivation}</Text>
          ) : null}
          {/* Pace/ETA line */}
          {state.goal?.active ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap', gap: 8 }}>
              {(() => { const p = paceState(); const bg = p==='ahead'?'#2bb673':(p==='on'?'#FFC107':'#e53935'); return (
                <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: bg }}>
                  <Text style={{ color: p==='on' ? '#000' : '#fff', fontWeight: '700' }}>{t('Pace', 'Pace', 'Tempo')}: {paceLabel()}</Text>
                </View>
              ); })()}
              {etaObj ? (
                <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#607D8B' }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>ETA {etaObj.eta.toLocaleDateString(language==='en'?'en-GB':(language==='pl'?'pl-PL':'de-DE'))}</Text>
                </View>
              ) : null}
              {(() => { const slope = (typeof trend.slopePerDay==='number'?trend.slopePerDay:0); if (!isFinite(slope)) return null; if (slope >= -0.02) { return (
                <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#ffebee' }}>
                  <Text style={{ color: '#c62828' }}>{t('Trend sehr flach – prüfe Plan (Wasser, Ernährung, Bewegung).', 'Trend very flat – check plan (water, nutrition, activity).', 'Trend bardzo płaski – sprawdź plan (woda, dieta, aktywność).')}</Text>
                </View>
              ); } return null; })()}
            </View>
          ) : null}
        </View>

        {/* Cycle */}
        ...

      </ScrollView>

      {/* Weight modal */}
      ...

      <CelebrationOverlay visible={showCelebration} message={celebrationText} onDone={() => setShowCelebration(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerCard: { borderRadius: 12, padding: 16 },
  card: { borderRadius: 12, padding: 12 },
  cta: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8 },
  iconBtn: { padding: 8, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  toggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  counterBtnSm: { paddingHorizontal: 8, paddingVertical: 8, borderRadius: 8, borderWidth: 1, minWidth: 36, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  quick: { width: '47%', borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center' },
});