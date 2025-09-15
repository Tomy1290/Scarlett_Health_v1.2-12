import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore, useLevel } from '../src/store/useStore';
import { LineChart } from 'react-native-gifted-charts';
import DateTimePicker from '@react-native-community/datetimepicker';
import { onlineAnalysis } from '../src/ai/online';

function useThemeColors(theme: string) {
  if (theme === 'pink_pastel') return { bg: '#fff0f5', card: '#ffe4ef', primary: '#d81b60', text: '#3a2f33', muted: '#8a6b75' };
  if (theme === 'pink_vibrant') return { bg: '#1b0b12', card: '#2a0f1b', primary: '#ff2d87', text: '#ffffff', muted: '#e59ab8' };
  if (theme === 'golden_pink') return { bg: '#fff8f0', card: '#ffe9c7', primary: '#dba514', text: '#2a1e22', muted: '#9b7d4e' };
  return { bg: '#fde7ef', card: '#ffd0e0', primary: '#e91e63', text: '#2a1e22', muted: '#7c5866' };
}

function daysBetween(a: Date, b: Date) { return Math.round((+b - +a) / (1000*60*60*24)); }

export default function AnalysisScreen() {
  const router = useRouter();
  const state = useAppStore();
  const { level, xp } = useLevel();
  const colors = useThemeColors(state.theme);

  const weightArrAll = useMemo(() => Object.values(state.days).filter((d) => typeof d.weight === 'number').sort((a, b) => a.date.localeCompare(b.date)), [state.days]);

  const [range, setRange] = useState<'7'|'14'|'30'|'custom'>('14');
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);

  const [help, setHelp] = useState<{[k:string]: boolean}>({});
  const toggleHelp = (k: string) => setHelp((h) => ({ ...h, [k]: !h[k] }));

  const weightArr = useMemo(() => {
    if (range === 'custom' && from && to) {
      return weightArrAll.filter(d => { const dt = new Date(d.date); return +dt >= +new Date(from.getFullYear(), from.getMonth(), from.getDate()) && +dt <= +new Date(to.getFullYear(), to.getMonth(), to.getDate()); });
    }
    const take = parseInt(range, 10);
    return weightArrAll.slice(-take);
  }, [weightArrAll, range, from, to]);

  const weightSeries = useMemo(() => weightArr.map((d) => ({ value: Number(d.weight) || 0 })), [weightArr]);

  const screenW = Dimensions.get('window').width;
  const chartWidth = Math.max(screenW - 32, weightSeries.length * 44);

  const last14 = useMemo(() => weightArrAll.slice(-14), [weightArrAll]);

  const t = (key: string) => { const de: Record<string, string> = { analysis: 'Analyse', weight: 'Gewichtsanalyse', app: 'Scarletts Gesundheitstracking', range7: '7 Tage', range14: '14 Tage', range30: '30 Tage', custom: 'Eigener Zeitraum', from: 'Von', to: 'Bis', weight_help: 'Wähle den Zeitraum und betrachte Trends.', insights: 'KI Insights', insights_help: 'Online-KI analysiert deine Daten kompakt.', aiultra: 'KI Pro+++ (Online)', aiultra_help: 'Online-Analyse mit personalisierten Tipps.' }; const en: Record<string, string> = { analysis: 'Analysis', weight: 'Weight analysis', app: "Scarlett’s Health Tracking", range7: '7 days', range14: '14 days', range30: '30 days', custom: 'Custom', from: 'From', to: 'To', weight_help: 'Select a range and see trends.', insights: 'AI insights', insights_help: 'Online AI gives compact insights.', aiultra: 'AI Pro+++ (online)', aiultra_help: 'Online analysis with personalized tips.' }; return (state.language === 'de' ? de : en)[key] || key; };

  // Online AI insights
  const [aiText, setAiText] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setAiLoading(true);
        const txt = await onlineAnalysis(state as any);
        if (active) setAiText(txt);
      } catch (e) {
        if (active) setAiText('');
      } finally {
        if (active) setAiLoading(false);
      }
    })();
    return () => { active = false; };
  }, [state.days, state.cycles, state.language]);

  const appTitle = t('app');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { backgroundColor: colors.card, paddingVertical: 12 }]}> 
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel={state.language==='de'?'Zurück':'Back'} style={{ padding: 8 }}>
          <Ionicons name='chevron-back' size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name='star' size={16} color={colors.primary} />
            <Text style={[styles.appTitle, { color: colors.text, marginHorizontal: 6 }]}>{appTitle}</Text>
            <Ionicons name='star' size={16} color={colors.primary} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '70%', alignSelf: 'center', marginTop: 6 }}>
            <Text style={{ color: colors.text }}>Level {level}</Text>
            <Text style={{ color: colors.text }}>{xp} XP</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* Gewicht */}
        <View style={[styles.card, { backgroundColor: colors.card }]}> 
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name='fitness' size={18} color={colors.primary} />
              <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}>{t('weight')}</Text>
            </View>
            <TouchableOpacity onPress={() => toggleHelp('weight')}>
              <Ionicons name='information-circle-outline' size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>
          {help.weight ? (<Text style={{ color: colors.muted, marginTop: 6 }}>{t('weight_help')}</Text>) : null}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <TouchableOpacity onPress={() => setRange('7')} style={[styles.badge, { borderColor: colors.muted, backgroundColor: range==='7'?colors.primary:'transparent' }]}><Text style={{ color: range==='7'?'#fff':colors.text }}>{t('range7')}</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setRange('14')} style={[styles.badge, { borderColor: colors.muted, backgroundColor: range==='14'?colors.primary:'transparent' }]}><Text style={{ color: range==='14'?'#fff':colors.text }}>{t('range14')}</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setRange('30')} style={[styles.badge, { borderColor: colors.muted, backgroundColor: range==='30'?colors.primary:'transparent' }]}><Text style={{ color: range==='30'?'#fff':colors.text }}>{t('range30')}</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setRange('custom')} style={[styles.badge, { borderColor: colors.muted, backgroundColor: range==='custom'?colors.primary:'transparent' }]}><Text style={{ color: range==='custom'?'#fff':colors.text }}>{t('custom')}</Text></TouchableOpacity>
            {range==='custom' ? (<><TouchableOpacity onPress={() => setShowFrom(true)} style={[styles.badge, { borderColor: colors.muted }]}><Text style={{ color: colors.text }}>{t('from')}: {from?from.toLocaleDateString():'--'}</Text></TouchableOpacity><TouchableOpacity onPress={() => setShowTo(true)} style={[styles.badge, { borderColor: colors.muted }]}><Text style={{ color: colors.text }}>{t('to')}: {to?to.toLocaleDateString():'--'}</Text></TouchableOpacity></>) : null}
          </View>
          {showFrom && (<DateTimePicker value={from || new Date()} mode='date' onChange={(e, d) => { setShowFrom(false); if (d) setFrom(d); }} />)}
          {showTo && (<DateTimePicker value={to || new Date()} mode='date' onChange={(e, d) => { setShowTo(false); if (d) setTo(d); }} />)}
          {weightSeries.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View style={{ width: chartWidth, height: 240, justifyContent: 'center' }}>
                <LineChart data={weightSeries} color={colors.primary} thickness={2} hideRules={false} showYAxisText yAxisTextStyle={{ color: colors.muted }} yAxisColor={colors.muted} xAxisColor={colors.muted} noOfSections={4} areaChart startFillColor={colors.primary} endFillColor={colors.primary} startOpacity={0.15} endOpacity={0.01} initialSpacing={12} spacing={32} />
              </View>
            </ScrollView>
          ) : (
            <Text style={{ color: colors.muted, marginTop: 6 }}>Zu wenige Daten</Text>
          )}
        </View>

        {/* KI Insights (online) */}
        <View style={[styles.card, { backgroundColor: colors.card }]}> 
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name='sparkles' size={18} color={colors.primary} />
              <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}>{t('insights')}</Text>
            </View>
          </View>
          <View style={{ marginTop: 8 }}>
            {aiLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color={colors.primary} />
                <Text style={{ color: colors.muted }}>KI analysiert…</Text>
              </View>
            ) : aiText ? (
              <Text style={{ color: colors.text, lineHeight: 20 }}>{aiText}</Text>
            ) : (
              <Text style={{ color: colors.muted }}>Keine KI-Antwort</Text>
            )}
          </View>
        </View>

        {/* KI Pro+++ online */}
        <View style={[styles.card, { backgroundColor: colors.card }]}> 
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name='pulse' size={18} color={colors.primary} />
              <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}>{t('aiultra')}</Text>
            </View>
            <TouchableOpacity onPress={() => toggleHelp('aiultra')}>
              <Ionicons name='information-circle-outline' size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>
          {help.aiultra ? (<Text style={{ color: colors.muted, marginTop: 6 }}>{t('aiultra_help')}</Text>) : null}
          <View style={{ marginTop: 8 }}>
            {aiLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color={colors.primary} />
                <Text style={{ color: colors.muted }}>KI analysiert…</Text>
              </View>
            ) : aiText ? (
              <Text style={{ color: colors.text, lineHeight: 20 }}>{aiText}</Text>
            ) : (
              <Text style={{ color: colors.muted }}>Keine KI-Antwort</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ header: { paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { fontSize: 12, fontWeight: '600' }, appTitle: { fontSize: 14, fontWeight: '800' }, card: { borderRadius: 12, padding: 12 }, badge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 } });