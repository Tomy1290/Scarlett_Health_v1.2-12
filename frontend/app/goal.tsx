import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppStore, useLevel } from '../src/store/useStore';
import { toKey } from '../src/utils/date';
import { LineChart } from 'react-native-gifted-charts';
import { onlineMotivation } from '../src/ai/online';

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
  const [motivation, setMotivation] = useState<string>('');

  const startDateKey = useMemo(() => existingGoal?.startDate || toKey(new Date()), [existingGoal?.startDate]);
  const startWeight = useMemo(() => existingGoal?.startWeight ?? latestWeight ?? undefined, [existingGoal?.startWeight, latestWeight]);
  const currentWeight = latestWeight;

  const targetW = useMemo(() => { const n = parseFloat((targetWeight||'').replace(',', '.')); return isNaN(n) ? undefined : n; }, [targetWeight]);
  const startDate = useMemo(() => new Date(startDateKey), [startDateKey]);
  const targetKey = toKey(targetDate);
  const endDate = useMemo(() => new Date(targetKey), [targetKey]);

  const totalDays = Math.max(1, daysBetween(startDate, endDate));
  const daysArr = useMemo(() => {
    const a: string[] = [];
    for (let i=0;i<=totalDays;i++) { const d = new Date(startDate); d.setDate(startDate.getDate()+i); a.push(toKey(d)); }
    return a;
  }, [startDateKey, totalDays]);

  const todayKey = toKey(new Date());
  const todayIdx = Math.min(totalDays, Math.max(0, daysBetween(startDate, new Date(todayKey))));

  // Plan series: linear from startWeight to targetWeight
  const planSeries = useMemo(() => {
    if (typeof startWeight !== 'number' || typeof targetW !== 'number' || totalDays <= 0) return [] as { value: number }[];
    const step = (startWeight - targetW) / totalDays;
    return daysArr.map((_, i) => ({ value: parseFloat((startWeight - step * i).toFixed(1)) }));
  }, [startWeight, targetW, totalDays, daysArr]);

  // Actual series: use recorded weights; highlight today point
  const actualSeries = useMemo(() => {
    return daysArr.map((k, i) => {
      const v = (state.days as any)[k]?.weight;
      if (typeof v === 'number') {
        return { value: Number(v), dataPointColor: i===todayIdx ? '#FF9800' : colors.primary, dataPointRadius: i===todayIdx ? 4 : 2 } as any;
      }
      return { value: 0, hideDataPoint: true } as any;
    });
  }, [daysArr, state.days, todayIdx, colors.primary]);

  // Derived KPIs
  const daysRemaining = Math.max(0, daysBetween(new Date(todayKey), endDate));
  const dailyNeeded = useMemo(() => {
    if (typeof currentWeight !== 'number' || typeof targetW !== 'number' || daysRemaining <= 0) return undefined;
    const delta = currentWeight - targetW; return Math.max(0, delta / daysRemaining);
  // Fetch short motivation for goal screen
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!state.aiInsightsEnabled) return;
        const m = await onlineMotivation(state as any);
        if (active) setMotivation(m);
      } catch {}
    })();
    return () => { active = false; };
  }, [state.language, state.days, state.goal]);

  }, [currentWeight, targetW, daysRemaining]);

  const progressPercent = useMemo(() => {
    if (typeof startWeight !== 'number' || typeof currentWeight !== 'number' || typeof targetW !== 'number') return 0;
    const total = startWeight - targetW; if (total <= 0) return 0; const done = startWeight - currentWeight; return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
  }, [startWeight, currentWeight, targetW]);

  const screenW = Dimensions.get('window').width;
  const spacing = 32;
  const chartWidth = Math.max(screenW - 32, daysArr.length * (spacing + 4));

  function t(key: string) {
    const de: Record<string,string> = {
      title: 'Zielgewicht', save: 'Speichern', remove: 'Ziel entfernen', pickDate: 'Datum wählen', weight: 'Wunschgewicht (kg)', date: 'Zieldatum',
      info: 'Lege dein Zielgewicht und ein Datum fest. Wir schätzen Dauer, täglichen Bedarf und Fortschritt. Der Plan läuft ab dem Tag der Zielsetzung bis zum Zieldatum.',
      analysis: 'Analyse', trendEta: 'ETA (Trend)', daily: 'Täglich nötig', progress: 'Fortschritt', plan: 'Plan vs. Ist',
      etaNa: 'Kein Trend erkennbar', day: 'Tag', days: 'Tage', start: 'Start', end: 'Ziel', paceAhead: 'Vor dem Plan', paceOn: 'Im Plan', paceBehind: 'Hinter dem Plan'
    };
    const en: Record<string,string> = { title: 'Target weight', save: 'Save', remove: 'Remove target', pickDate: 'Pick date', weight: 'Target weight (kg)', date: 'Target date', info: 'Set your target weight and date. We estimate duration, daily need and progress. The plan runs from goal set date to target date.', analysis: 'Analysis', trendEta: 'ETA (trend)', daily: 'Daily needed', progress: 'Progress', plan: 'Plan vs. actual', etaNa: 'No trend visible', day: 'day', days: 'days', start: 'Start', end: 'Target', paceAhead: 'Ahead of plan', paceOn: 'On plan', paceBehind: 'Behind plan' };
    const pl: Record<string,string> = { title: 'Waga docelowa', save: 'Zapisz', remove: 'Usuń cel', pickDate: 'Wybierz datę', weight: 'Waga docelowa (kg)', date: 'Data docelowa', info: 'Ustaw wagę i datę. Szacujemy czas, dzienne tempo i postęp. Plan biegnie od dnia ustawienia celu do daty docelowej.', analysis: 'Analiza', trendEta: 'ETA (trend)', daily: 'Dzienne wymagane', progress: 'Postęp', plan: 'Plan vs. stan', etaNa: 'Brak trendu', day: 'dzień', days: 'dni', start: 'Start', end: 'Cel', paceAhead: 'Przed planem', paceOn: 'Zgodnie z planem', paceBehind: 'Za planem' };
    const map = state.language==='en'?en:(state.language==='pl'?pl:de); return map[key] || key;
  }

  function paceText() {
    if (typeof currentWeight !== 'number' || !planSeries.length) return '';
    const plannedToday = planSeries[Math.min(todayIdx, planSeries.length - 1)]?.value || currentWeight;
    if (currentWeight < plannedToday - 0.2) return t('paceAhead');
    if (Math.abs(currentWeight - plannedToday) <= 0.2) return t('paceOn');
    return t('paceBehind');
  }

  function saveGoal() {
    const tw = targetW; if (typeof tw !== 'number' || tw <= 0) return;
    const startW = typeof startWeight === 'number' ? startWeight : (currentWeight || tw);
    state.setGoal({ targetWeight: tw, targetDate: toKey(targetDate), startWeight: startW, startDate: toKey(new Date()), active: true });
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
          {/* Info + Inputs */}
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

          {state.aiInsightsEnabled && !!motivation ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: colors.text }}>{motivation}</Text>
            </View>
          ) : null}

              <TouchableOpacity onPress={saveGoal} style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.primary }]}><Text style={{ color: '#fff' }}>{t('save')}</Text></TouchableOpacity>
            </View>
          </View>

          {/* KPIs */}
          <View style={[styles.card, { backgroundColor: colors.card }]}> 
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name='sparkles' size={18} color={colors.primary} />
                <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}>{t('analysis')}</Text>
              </View>
            </View>
            <View style={{ marginTop: 8, gap: 6 }}>
              <Text style={{ color: colors.muted }}>{t('progress')}: {progressPercent}%</Text>
              <View style={{ height: 8, backgroundColor: colors.bg, borderRadius: 4, overflow: 'hidden', marginTop: 6 }}>
                <View style={{ width: `${progressPercent}%`, height: 8, backgroundColor: colors.primary }} />
              </View>
              <Text style={{ color: colors.muted }}>{t('daily')}: {typeof dailyNeeded === 'number' ? `${dailyNeeded.toFixed(2)} kg/${t('day')}` : '—'}</Text>
              <Text style={{ color: colors.muted }}>{paceText()}</Text>
            </View>
          </View>

          {/* Chart: full range from start to target, scrollable */}
          <View style={[styles.card, { backgroundColor: colors.card }]}> 
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name='stats-chart' size={18} color={colors.primary} />
                <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}>{t('plan')}</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View style={{ width: chartWidth, paddingVertical: 8 }}>
                <LineChart
                  data={actualSeries}
                  data2={planSeries}
                  height={240}
                  width={chartWidth}
                  color={colors.primary}
                  color2={'#9c27b0'}
                  thickness={2}
                  thickness2={2}
                  showDataPoints
                  showDataPoints2
                  yAxisColor={colors.muted}
                  xAxisColor={colors.muted}
                  showYAxisText
                  yAxisTextStyle={{ color: colors.muted }}
                  initialSpacing={16}
                  spacing={32}
                  areaChart={false}
                  hideRules={false}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ color: colors.muted }}>{startDateKey}</Text>
                  <Text style={{ color: colors.muted }}>{targetKey}</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ header: { paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, card: { borderRadius: 12, padding: 12 }, badge: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 } });