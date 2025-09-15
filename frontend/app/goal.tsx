import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppStore, useLevel } from '../src/store/useStore';
import { toKey } from '../src/utils/date';

function useThemeColors(theme: string) {
  if (theme === 'pink_pastel') return { bg: '#fff0f5', card: '#ffe4ef', primary: '#d81b60', text: '#3a2f33', muted: '#8a6b75' };
  if (theme === 'pink_vibrant') return { bg: '#1b0b12', card: '#2a0f1b', primary: '#ff2d87', text: '#ffffff', muted: '#e59ab8' };
  if (theme === 'golden_pink') return { bg: '#fff8f0', card: '#ffe9c7', primary: '#dba514', text: '#2a1e22', muted: '#9b7d4e' };
  return { bg: '#fde7ef', card: '#ffd0e0', primary: '#e91e63', text: '#2a1e22', muted: '#7c5866' };
}

function getLatestWeightKg(days: Record<string, any>): number | undefined {
  const arr = Object.values(days).filter((d: any) => typeof d.weight === 'number' && d.date).sort((a: any, b: any) => String(a.date).localeCompare(String(b.date)));
  const w = arr.length ? Number(arr[arr.length - 1].weight) : undefined;
  return isNaN(w as any) ? undefined : (w as number);
}

function daysBetween(a: Date, b: Date) { return Math.round((+b - +a) / (1000*60*60*24)); }

export default function GoalScreen() {
  const router = useRouter();
  const state = useAppStore();
  const { level } = useLevel();
  const colors = useThemeColors(state.theme);

  const latestWeight = getLatestWeightKg(state.days);
  const existingGoal = state.goal;

  const [targetWeight, setTargetWeight] = useState<string>(existingGoal ? String(existingGoal.targetWeight) : (latestWeight ? String(Math.max(40, Math.round(latestWeight - 5))) : ''));
  const [targetDate, setTargetDate] = useState<Date>(existingGoal ? new Date(existingGoal.targetDate) : new Date(Date.now() + 1000*60*60*24*30));
  const [showPicker, setShowPicker] = useState(false);
  const [help, setHelp] = useState<Record<string, boolean>>({ info: true });

  // Build analysis
  const startWeight = useMemo(() => existingGoal?.startWeight ?? latestWeight ?? undefined, [existingGoal?.startWeight, latestWeight]);
  const currentWeight = latestWeight;
  const targetW = useMemo(() => { const n = parseFloat((targetWeight||'').replace(',', '.')); return isNaN(n) ? undefined : n; }, [targetWeight]);

  const today = new Date();
  const targetKey = toKey(targetDate);
  const daysRemaining = Math.max(0, daysBetween(new Date(toKey(today)), new Date(targetKey)));

  // compute slope from history (last 14 days)
  const lastKeys = useMemo(() => Object.keys(state.days).sort().slice(-14), [state.days]);
  const slopePerDay = useMemo(() => {
    const pts = lastKeys.map(k => ({ k, w: typeof (state.days as any)[k]?.weight === 'number' ? Number((state.days as any)[k]?.weight) : undefined })).filter(p => typeof p.w === 'number');
    if (pts.length < 2) return 0;
    const first = pts[0], last = pts[pts.length - 1];
    const dd = Math.max(1, daysBetween(new Date(first.k), new Date(last.k)));
    return (last.w! - first.w!) / dd; // kg per day (negative means losing)
  }, [state.days, lastKeys]);

  const etaDaysByTrend = useMemo(() => {
    if (typeof currentWeight !== 'number' || typeof targetW !== 'number') return undefined;
    const delta = currentWeight - targetW;
    if (Math.abs(delta) < 0.001) return 0;
    if (slopePerDay >= 0) return undefined; // moving away or flat
    const d = Math.ceil(delta / Math.abs(slopePerDay));
    return d < 0 ? undefined : d;
  }, [currentWeight, targetW, slopePerDay]);

  const dailyNeeded = useMemo(() => {
    if (typeof currentWeight !== 'number' || typeof targetW !== 'number') return undefined;
    if (daysRemaining <= 0) return undefined;
    const delta = currentWeight - targetW; // want to lose positive delta
    return Math.max(0, delta / daysRemaining);
  }, [currentWeight, targetW, daysRemaining]);

  const progressPercent = useMemo(() => {
    if (typeof startWeight !== 'number' || typeof currentWeight !== 'number' || typeof targetW !== 'number') return 0;
    const total = startWeight - targetW;
    if (total <= 0) return 0;
    const done = startWeight - currentWeight;
    return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
  }, [startWeight, currentWeight, targetW]);

  // Plan series (linear plan from today to target)
  const planSeries = useMemo(() => {
    if (typeof currentWeight !== 'number' || typeof targetW !== 'number' || daysRemaining <= 0) return [] as { value: number }[];
    const n = Math.min(30, Math.max(2, daysRemaining));
    const step = (currentWeight - targetW) / n;
    return new Array(n).fill(0).map((_, i) => ({ value: parseFloat((currentWeight - step * i).toFixed(1)) }));
  }, [currentWeight, targetW, daysRemaining]);

  const actualSeries = useMemo(() => {
    const keys = Object.keys(state.days).sort().slice(-Math.max(7, planSeries.length));
    return keys.map(k => ({ value: typeof (state.days as any)[k]?.weight === 'number' ? Number((state.days as any)[k]?.weight) : 0 })).filter(d => d.value > 0);
  }, [state.days, planSeries.length]);

  function t(key: string) {
    const de: Record<string,string> = {
      title: 'Zielgewicht', save: 'Speichern', remove: 'Ziel entfernen', pickDate: 'Datum wählen', weight: 'Wunschgewicht (kg)', date: 'Zieldatum',
      info: 'Lege dein Zielgewicht und ein Datum fest. Wir schätzen Dauer, täglichen Bedarf und Fortschritt.',
      analysis: 'Analyse', trendEta: 'ETA (Trend)', daily: 'Täglich nötig', progress: 'Fortschritt', plan: 'Plan vs. Ist',
      etaNa: 'Kein Trend erkennbar', day: 'Tag', days: 'Tage',
    };
    const en: Record<string,string> = { title: 'Target weight', save: 'Save', remove: 'Remove target', pickDate: 'Pick date', weight: 'Target weight (kg)', date: 'Target date', info: 'Set your target weight and date. We estimate duration, daily need and progress.', analysis: 'Analysis', trendEta: 'ETA (trend)', daily: 'Daily needed', progress: 'Progress', plan: 'Plan vs. actual', etaNa: 'No trend visible', day: 'day', days: 'days' };
    const pl: Record<string,string> = { title: 'Waga docelowa', save: 'Zapisz', remove: 'Usuń cel', pickDate: 'Wybierz datę', weight: 'Waga docelowa (kg)', date: 'Data docelowa', info: 'Ustaw wagę i datę. Szacujemy czas, dzienne tempo i postęp.', analysis: 'Analiza', trendEta: 'ETA (trend)', daily: 'Dzienne wymagane', progress: 'Postęp', plan: 'Plan vs. stan', etaNa: 'Brak trendu', day: 'dzień', days: 'dni' };
    const map = state.language==='en'?en:(state.language==='pl'?pl:de);
    return map[key] || key;
  }

  function saveGoal() {
    if (typeof targetW !== 'number' || targetW <= 0) return;
    const start = typeof startWeight === 'number' ? startWeight : (currentWeight || targetW);
    state.setGoal({ targetWeight: targetW, targetDate: toKey(targetDate), startWeight: start, active: true });
  }
  function clearGoal() { state.removeGoal(); }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[styles.header, { backgroundColor: colors.card }]}> 
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <Ionicons name='chevron-back' size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>{t('title')}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Scarlett</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {/* Info */}
          <View style={[styles.card, { backgroundColor: colors.card }]}> 
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{t('title')}</Text>
              <TouchableOpacity onPress={() => setHelp(h => ({...h, info: !h.info}))}><Ionicons name='information-circle-outline' size={18} color={colors.muted} /></TouchableOpacity>
            </View>
            {help.info ? <Text style={{ color: colors.muted, marginTop: 6 }}>{t('info')}</Text> : null}

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, marginBottom: 6 }}>{t('weight')}</Text>
                <TextInput value={targetWeight} onChangeText={setTargetWeight} keyboardType='decimal-pad' placeholder='e.g. 62.0' placeholderTextColor={colors.muted} style={{ borderWidth: 1, borderColor: colors.muted, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: colors.text }} />
              </View>
              <View style={{ width: 140 }}>
                <Text style={{ color: colors.text, marginBottom: 6 }}>{t('date')}</Text>
                <TouchableOpacity onPress={() => setShowPicker(true)} style={[styles.badge, { borderColor: colors.muted }]}> 
                  <Text style={{ color: colors.text }}>{toKey(targetDate)}</Text>
                </TouchableOpacity>
                {showPicker ? (
                  <DateTimePicker value={targetDate} mode='date' onChange={(e, d) => { setShowPicker(false); if (d) setTargetDate(d); }} />
                ) : null}
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
              {state.goal ? (
                <TouchableOpacity onPress={clearGoal} style={[styles.badge, { borderColor: colors.muted }]}><Text style={{ color: colors.text }}>{t('remove')}</Text></TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={saveGoal} style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.primary }]}><Text style={{ color: '#fff' }}>{t('save')}</Text></TouchableOpacity>
            </View>
          </View>

          {/* Analysis */}
          <View style={[styles.card, { backgroundColor: colors.card }]}> 
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name='sparkles' size={18} color={colors.primary} />
                <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}>{t('analysis')}</Text>
              </View>
            </View>

            <View style={{ marginTop: 8, gap: 6 }}>
              <Text style={{ color: colors.muted }}>
                {t('trendEta')}: {typeof etaDaysByTrend === 'number' ? `${etaDaysByTrend} ${etaDaysByTrend === 1 ? t('day') : t('days')}` : t('etaNa')}
              </Text>
              <Text style={{ color: colors.muted }}>
                {t('daily')}: {typeof dailyNeeded === 'number' ? `${dailyNeeded.toFixed(2)} kg/${t('day')}` : '—'}
              </Text>
              <View>
                <Text style={{ color: colors.muted }}>{t('progress')}: {progressPercent}%</Text>
                <View style={{ height: 8, backgroundColor: colors.bg, borderRadius: 4, overflow: 'hidden', marginTop: 6 }}>
                  <View style={{ width: `${progressPercent}%`, height: 8, backgroundColor: colors.primary }} />
                </View>
              </View>
            </View>
          </View>

          {/* Chart (plan vs actual) */}
          <View style={[styles.card, { backgroundColor: colors.card }]}> 
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name='stats-chart' size={18} color={colors.primary} />
                <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}>{t('plan')}</Text>
              </View>
            </View>
            <View style={{ marginTop: 8 }}>
              {planSeries.length > 1 || actualSeries.length > 1 ? (
                <View>
                  {/* Simple bars to avoid adding another lib: show two rows of mini-bars */}
                  <Text style={{ color: colors.muted, marginBottom: 4 }}>Ist</Text>
                  <View style={{ height: 6, backgroundColor: colors.bg, borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ width: '100%', height: 6, backgroundColor: colors.bg }} />
                  </View>
                  <Text style={{ color: colors.muted, marginTop: 8, marginBottom: 4 }}>Plan</Text>
                  <View style={{ height: 6, backgroundColor: colors.bg, borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ width: '100%', height: 6, backgroundColor: colors.bg }} />
                  </View>
                  <Text style={{ color: colors.muted, marginTop: 8 }}>Hinweis: Detailliertes Liniendiagramm ist in der Analyse verfügbar.</Text>
                </View>
              ) : (
                <Text style={{ color: colors.muted }}>Zu wenige Daten</Text>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ header: { paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, card: { borderRadius: 12, padding: 12 }, badge: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 } });