import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert, Switch, TextInput, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { useRouter } from "expo-router";
import { useAppStore } from "../src/store/useStore";
import { 
  initializeNotifications, 
  cancelNotification, 
  testNotification, 
  scheduleDailyNext,
  isHyperOSLike,
} from "../src/utils/notifications";
import { TimePicker } from "../src/components/TimePicker";
import { parseHHMM, toHHMM } from "../src/utils/time";

function useThemeColors(theme: string) {
  if (theme === 'pink_pastel') return { bg: '#fff0f5', card: '#ffe4ef', primary: '#d81b60', text: '#3a2f33', muted: '#8a6b75', input: '#fff' };
  if (theme === 'pink_vibrant') return { bg: '#1b0b12', card: '#2a0f1b', primary: '#ff2d87', text: '#ffffff', muted: '#e59ab8', input: '#1f1520' };
  if (theme === 'golden_pink') return { bg: '#fff8f0', card: '#ffe9c7', primary: '#dba514', text: '#2a1e22', muted: '#9b7d4e', input: '#fff' };
  return { bg: '#fde7ef', card: '#ffd0e0', primary: '#e91e63', text: '#2a1e22', muted: '#7c5866', input: '#ffffff' };
}

function themeLabel(key: 'pink_default'|'pink_pastel'|'pink_vibrant'|'golden_pink', lang: 'de'|'en'|'pl') {
  const mapDe: Record<string,string&gt; = { pink_default: 'Rosa – Standard', pink_pastel: 'Rosa – Pastell', pink_vibrant: 'Rosa – Kräftig', golden_pink: 'Goldenes Rosa' };
  const mapEn: Record<string,string&gt; = { pink_default: 'Pink – Default', pink_pastel: 'Pink – Pastel', pink_vibrant: 'Pink – Vibrant', golden_pink: 'Golden Pink' };
  const mapPl: Record<string,string&gt; = { pink_default: 'Różowy – domyślny', pink_pastel: 'Różowy – pastel', pink_vibrant: 'Różowy – intensywny', golden_pink: 'Złoty róż' };
  return (lang==='en'?mapEn:(lang==='pl'?mapPl:mapDe))[key] || key;
}

function reminderLabel(type: string, lang: 'de'|'en'|'pl', label?: string) {
  if (label) return label;
  const mapDe: Record<string,string&gt; = { pills_morning: 'Tabletten morgens', pills_evening: 'Tabletten abends', weight: 'Gewicht', water: 'Wasser', sport: 'Sport', custom: 'Eigene Erinnerung' };
  const mapEn: Record<string,string&gt; = { pills_morning: 'Pills morning', pills_evening: 'Pills evening', weight: 'Weight', water: 'Water', sport: 'Sport', custom: 'Custom reminder' };
  const mapPl: Record<string,string&gt; = { pills_morning: 'Tabletki rano', pills_evening: 'Tabletki wieczorem', weight: 'Waga', water: 'Woda', sport: 'Sport', custom: 'Własne przypomnienie' };
  return (lang==='en'?mapEn:(lang==='pl'?mapPl:mapDe))[type] || type;
}

export default function SettingsScreen() {
  const state = useAppStore();
  const router = useRouter();
  const colors = useThemeColors(state.theme);

  const appTitle = state.language==='en' ? "Scarlett’s Health Tracking" : (state.language==='pl'? 'Zdrowie Scarlett' : 'Scarletts Gesundheitstracking');
  const version = Constants?.expoConfig?.version || '—';

  const [customMode, setCustomMode] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customTime, setCustomTime] = useState('08:00');
  const [cupInput, setCupInput] = useState(String(state.waterCupMl || 250));
  const [reminderTimes, setReminderTimes] = useState<Record<string, string&gt;&gt;({});
  const [debugSwitch, setDebugSwitch] = useState(false);

  // Initialize reminder times from stored reminders - UNIFIED STRING FORMAT
  useEffect(() =&gt; {
    const times: Record<string, string&gt; = {};
    if (state.reminders && Array.isArray(state.reminders)) {
      for (const r of state.reminders) {
        if (!r || !r.id) continue;
        const t = toHHMM((r as any).time);
        if (t) times[r.id] = t;
      }
    }
    setReminderTimes(times);
  }, [state.reminders]);

  async function saveCustomReminder() {
    const currentCustom = state.reminders.filter(r =&gt; !!r.label).length;
    if (currentCustom &gt;= 10) {
      Alert.alert(
        state.language==='de'?'Limit erreicht':(state.language==='pl'?'Limit osiągnięty':'Limit reached'), 
        state.language==='de'?'Maximal 10 eigene Erinnerungen.':(state.language==='pl'?'Maks. 10 własnych przypomnień.':'Maximum 10 custom reminders.')
      );
      return;
    }

    if (!customLabel.trim() || !customTime) {
      Alert.alert(state.language==='de'?'Bitte alle Felder ausfüllen':(state.language==='pl'?'Proszę wypełnić wszystkie pola':'Please fill all fields'));
      return;
    }

    const initialized = await initializeNotifications();
    if (!initialized) return;

    const id = `custom_${Date.now()}`;

    const timeData = parseHHMM(customTime);
    if (!timeData) {
      Alert.alert('Fehler', 'Ungültige Zeit');
      return;
    }

    // Schedule next occurrence one-time
    const notifId = await scheduleDailyNext(id, customLabel.trim(), 'Custom reminder', timeData.hour, timeData.minute, 'reminders');

    if (notifId) {
      const tStr = `${timeData.hour.toString().padStart(2,'0')}:${timeData.minute.toString().padStart(2,'0')}`;
      state.addReminder({ id, type: 'custom', label: customLabel.trim(), time: tStr, enabled: true });
      state.setNotificationMeta(id, { id: notifId, time: tStr });
      setReminderTimes(prev =&gt; ({ ...prev, [id]: tStr }));

      setCustomMode(false);
      setCustomLabel('');
      setCustomTime('08:00');
      Alert.alert(state.language==='de'?'Gespeichert':(state.language==='pl'?'Zapisano':'Saved'));
    }
  }

  async function seedDefaults() {
    const initialized = await initializeNotifications();
    if (!initialized) {
      Alert.alert('Fehler', 'Benachrichtigungen konnten nicht initialisiert werden.');
      return;
    }

    const defaults = [
      { id: 'pill_morning', type: 'pills_morning', title: state.language==='de'?'Tabletten morgens':(state.language==='pl'?'Tabletki rano':'Pills morning'), body: state.language==='de'?'Bitte Tabletten einnehmen.':(state.language==='pl'?'Proszę przyjąć tabletki.':'Please take your pills.'), hour: 8, minute: 0 },
      { id: 'pill_evening', type: 'pills_evening', title: state.language==='de'?'Tabletten abends':(state.language==='pl'?'Tabletki wieczorem':'Pills evening'), body: state.language==='de'?'Bitte Tabletten einnehmen.':(state.language==='pl'?'Proszę przyjąć tabletki.':'Please take your pills.'), hour: 20, minute: 0 },
      { id: 'weight_morning', type: 'weight', title: state.language==='de'?'Gewicht':(state.language==='pl'?'Waga':'Weight'), body: state.language==='de'?'Gewicht morgens eintragen.':(state.language==='pl'?'Zapisz wagę rano.':'Log weight in the morning.'), hour: 7, minute: 0 },
      { id: 'water_daily', type: 'water', title: state.language==='de'?'Wasser':(state.language==='pl'?'Woda':'Water'), body: state.language==='de'?'Ein Glas Wasser trinken.':(state.language==='pl'?'Wypij szklankę wody.':'Have a glass of water.'), hour: 10, minute: 0 },
      { id: 'sport_daily', type: 'sport', title: state.language==='de'?'Sport':(state.language==='pl'?'Sport':'Sport'), body: state.language==='de'?'Zeit für Sport.':(state.language==='pl'?'Czas na sport.':'Time for sport.'), hour: 16, minute: 0 },
    ];

    for (const def of defaults) {
      const notifId = await scheduleDailyNext(def.id, def.title, def.body, def.hour, def.minute, 'reminders');
      if (notifId) {
        const timeString = `${def.hour.toString().padStart(2, '0')}:${def.minute.toString().padStart(2, '0')}`;
        state.addReminder({ id: def.id, type: def.type, time: timeString, enabled: true });
        state.setNotificationMeta(def.id, { id: notifId, time: timeString });
        setReminderTimes(prev =&gt; ({ ...prev, [def.id]: timeString }));
      }
    }

    Alert.alert(state.language==='de'?'Erledigt':(state.language==='pl'?'Gotowe':'Done'), state.language==='de'?'Standard-Erinnerungen aktiviert.':(state.language==='pl'?'Domyślne przypomnienia włączone.':'Default reminders enabled.'));
  }

  async function toggleReminder(id: string, enabled: boolean) {
    const r = state.reminders.find(x=&gt;x.id===id);
    if (!r) return;
    if (enabled) {
      const initialized = await initializeNotifications();
      if (!initialized) { Alert.alert('Fehler', 'Benachrichtigungen konnten nicht initialisiert werden.'); return; }
      const title = reminderLabel(r.type, state.language as any, r.label);
      const timeData = parseHHMM(r.time);
      if (!timeData) return;

      const prev = state.notificationMeta[id];
      if (prev?.id) await cancelNotification(prev.id);

      const notifId = await scheduleDailyNext(id, title, state.language==='de'?'Zeit für eine Aktion':(state.language==='pl'?'Czas na działanie':'Time for an action'), timeData.hour, timeData.minute, 'reminders');
      if (notifId) { state.updateReminder(id, { enabled: true }); state.setNotificationMeta(id, { id: notifId, time: r.time }); }
    } else {
      const meta = state.notificationMeta[id];
      if (meta?.id) await cancelNotification(meta.id);
      state.updateReminder(id, { enabled: false });
      state.setNotificationMeta(id, undefined);
    }
  }

  async function updateTime(id: string, newTime: string) {
    const timeData = parseHHMM(newTime);
    if (!timeData) return;
    const timeString = `${timeData.hour.toString().padStart(2, '0')}:${timeData.minute.toString().padStart(2, '0')}`;

    const r = state.reminders.find(x =&gt; x.id === id);
    if (!r) return;

    state.updateReminder(id, { time: timeString });

    const meta = state.notificationMeta[id];
    const title = reminderLabel(r.type, state.language as any, r.label);

    if (r.enabled) {
      if (meta?.id) { await cancelNotification(meta.id); }
      const initialized = await initializeNotifications();
      if (!initialized) return;

      const newNotifId = await scheduleDailyNext(id, title, state.language==='de'?'Zeit für eine Aktion':(state.language==='pl'?'Czas na działanie':'Time for an action'), timeData.hour, timeData.minute, 'reminders');
      if (newNotifId) { state.setNotificationMeta(id, { id: newNotifId, time: timeString }); }
    } else {
      state.setNotificationMeta(id, { id: meta?.id || '', time: timeString });
    }

    setReminderTimes(prev =&gt; ({ ...prev, [id]: timeString }));
  }

  async function exportData() {
    try {
      const data = useAppStore.getState();
      const keys = ['days','goal','reminders','chat','saved','achievementsUnlocked','xp','language','theme','eventHistory','legendShown','rewardsSeen','profileAlias','xpLog','aiInsightsEnabled','aiFeedback','eventsEnabled','cycles','cycleLogs','waterCupMl'];
      const snapshot: any = {}; for (const k of keys) (snapshot as any)[k] = (data as any)[k];
      const json = JSON.stringify(snapshot, null, 2);
      if (Platform.OS === 'android' &amp;&amp; (FileSystem as any).StorageAccessFramework) {
        const saf = (FileSystem as any).StorageAccessFramework;
        const perm = await saf.requestDirectoryPermissionsAsync();
        if (!perm.granted) { Alert.alert('Hinweis', 'Keine Ordnerberechtigung erteilt.'); return; }
        const fileUri = await saf.createFileAsync(perm.directoryUri, `scarlett-backup-${Date.now()}.json`, 'application/json');
        await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });
        Alert.alert('Export', 'Backup wurde gespeichert.');
      } else {
        const fileUri = FileSystem.cacheDirectory + `scarlett-backup-${Date.now()}.json`;
        await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Export' });
      }
    } catch (e) { Alert.alert('Error', String(e)); }
  }

  async function importData() {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (res.canceled || !res.assets?.[0]?.uri) return;
      const txt = await FileSystem.readAsStringAsync(res.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });
      const parsed = JSON.parse(txt);
      const keys = ['days','goal','reminders','chat','saved','achievementsUnlocked','xp','language','theme','eventHistory','legendShown','rewardsSeen','profileAlias','xpLog','aiInsightsEnabled','aiFeedback','eventsEnabled','cycles','cycleLogs','waterCupMl'];
      const patch: any = {}; for (const k of keys) if (k in parsed) patch[k] = parsed[k];
      useAppStore.setState(patch);
      useAppStore.getState().recalcAchievements();
      Alert.alert(state.language==='de'?'Import abgeschlossen':(state.language==='pl'?'Import zakończony':'Import finished'));
    } catch (e) { Alert.alert('Error', String(e)); }
  }

  const desiredOrder = ['pills_morning','pills_evening','weight','water','sport'];
  const sortedReminders = [...state.reminders].sort((a,b) =&gt; { const ai = desiredOrder.indexOf(a.type); const bi = desiredOrder.indexOf(b.type); const aIdx = ai < 0 ? 999 : ai; const bIdx = bi < 0 ? 999 : bi; return aIdx - bIdx; });

  const showBatteryHint = Platform.OS === 'android' &amp;&amp; isHyperOSLike();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}&gt;
      <View style={[styles.header, { backgroundColor: colors.card, paddingVertical: 16 }]}&gt; 
        <TouchableOpacity onPress={() =&gt; router.back()} style={styles.iconBtn} accessibilityLabel='Zurück'&gt;
          <Ionicons name='chevron-back' size={26} color={colors.text} /&gt;
        </TouchableOpacity&gt;
        <View style={{ alignItems: 'center' }}&gt;
          <View style={{ flexDirection: 'row', alignItems: 'center' }}&gt;
            <Ionicons name='star' size={16} color={colors.primary} /&gt;
            <Text style={[styles.appTitle, { color: colors.text, marginHorizontal: 6 }]}&gt;{appTitle}</Text&gt;
            <Ionicons name='star' size={16} color={colors.primary} /&gt;
          </View&gt;
          <Text style={[styles.title, { color: colors.muted }]}&gt;{state.language==='de'?'Einstellungen':(state.language==='pl'?'Ustawienia':'Settings')}</Text&gt;
        </View&gt;
        <View style={{ width: 40 }} /&gt;
      </View&gt;

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}&gt;
        {/* Language */}
        <View style={[styles.card, { backgroundColor: colors.card }]}&gt; 
          <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 8 }}&gt;{state.language==='de'?'Sprache':(state.language==='pl'?'Język':'Language')}</Text&gt;
          <View style={{ flexDirection: 'row', gap: 8 }}&gt;
            <TouchableOpacity onPress={() =&gt; state.setLanguage('de')} style={[styles.badge, { borderColor: colors.muted, backgroundColor: state.language==='de'?colors.primary:'transparent' }]}&gt;<Text style={{ color: state.language==='de'?'#fff':colors.text }}&gt;Deutsch</Text&gt;</TouchableOpacity&gt;
            <TouchableOpacity onPress={() =&gt; state.setLanguage('en')} style={[styles.badge, { borderColor: colors.muted, backgroundColor: state.language==='en'?colors.primary:'transparent' }]}&gt;<Text style={{ color: state.language==='en'?'#fff':colors.text }}&gt;English</Text&gt;</TouchableOpacity&gt;
            <TouchableOpacity onPress={() =&gt; state.setLanguage('pl')} style={[styles.badge, { borderColor: colors.muted, backgroundColor: state.language==='pl'?colors.primary:'transparent' }]}&gt;<Text style={{ color: state.language==='pl'?'#fff':colors.text }}&gt;Polski</Text&gt;</TouchableOpacity&gt;
          </View&gt;
        </View&gt;

        {/* Theme */}
        <View style={[styles.card, { backgroundColor: colors.card }]}&gt; 
          <Text style={{ color: colors.text, fontWeight: '700' }}&gt;{state.language==='de'?'Theme':(state.language==='pl'?'Motyw':'Theme')}</Text&gt;
          <Text style={{ color: colors.muted, marginTop: 6 }}&gt;{state.language==='de'?'Wähle ein App-Theme. „Golden Pink“ ab Level 75.':(state.language==='pl'?'Wybierz motyw aplikacji. „Golden Pink” od poziomu 75.':'Choose an app theme. "Golden Pink" unlocks at level 75.')}</Text&gt;
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}&gt;
            {(['pink_default','pink_pastel','pink_vibrant','golden_pink'] as const).map((t) =&gt; (
              <TouchableOpacity key={t} onPress={() =&gt; state.setTheme(t)} style={[styles.badge, { borderColor: colors.muted, backgroundColor: state.theme===t?colors.primary:'transparent' }]}&gt;
                <Text style={{ color: state.theme===t?'#fff':colors.text }}&gt;{themeLabel(t, state.language as any)}</Text&gt;
              </TouchableOpacity&gt;
            ))}
          </View&gt;
        </View&gt;

        {/* Drinks settings */}
        <View style={[styles.card, { backgroundColor: colors.card }]}&gt; 
          <View style={{ flexDirection: 'row', alignItems: 'center' }}&gt;
            <Ionicons name='cafe' size={18} color={colors.primary} /&gt;
            <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}&gt;{state.language==='de'?'Trinken':(state.language==='pl'?'Napoje':'Drinks')}</Text&gt;
          </View&gt;
          <Text style={{ color: colors.muted, marginTop: 6 }}&gt;{state.language==='de'?'Bechergröße für Wasser (ml). Fortschrittsbalken berechnet Tagesziel automatisch aus Gewicht (35 ml/kg) und +500 ml bei Sport.':(state.language==='pl'?'Rozmiar kubka wody (ml). Pasek postępu oblicza cel dzienny automatycznie z wagi (35 ml/kg) i +500 ml przy sporcie.':'Cup size for water (ml). Progress bar computes daily target automatically from weight (35 ml/kg) and +500 ml if sport.')}</Text&gt;
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}&gt;
            <Text style={{ color: colors.text, width: 160 }}&gt;{state.language==='de'?'Bechergröße':(state.language==='pl'?'Rozmiar kubka':'Cup size')}</Text&gt;
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}&gt;
              <TextInput keyboardType='number-pad' value={cupInput} onChangeText={setCupInput} onBlur={() =&gt; { const n = parseInt((cupInput||'').replace(/[^0-9]/g,'' )||'0',10); const v = Math.max(0, Math.min(1000, isNaN(n)?0:n)); state.setWaterCupMl(v); setCupInput(String(v)); }} style={{ flex: 1, borderWidth: 1, borderColor: colors.muted, borderRadius: 8, paddingHorizontal: 10, color: colors.text, backgroundColor: colors.input }} /&gt;
              <Text style={{ color: colors.muted, marginLeft: 8 }}&gt;ml</Text&gt;
            </View&gt;
          </View&gt;
          <Text style={{ color: colors.muted, marginTop: 6 }}&gt;{state.language==='de'?'Bereich: 0–1000 ml.':(state.language==='pl'?'Zakres: 0–1000 ml.':'Range: 0–1000 ml.')}</Text&gt;
        </View&gt;

        {/* Reminders */}
        <View style={[styles.card, { backgroundColor: colors.card }]}&gt; 
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}&gt;
            <Text style={{ color: colors.text, fontWeight: '700' }}&gt;{state.language==='de'?'Erinnerungen':(state.language==='pl'?'Przypomnienia':'Reminders')}</Text&gt;
            <View style={{ flexDirection: 'row', gap: 8 }}&gt;
              <TouchableOpacity onPress={testNotification} style={[styles.badge, { backgroundColor: '#4CAF50', borderColor: '#4CAF50' }]}&gt;
                <Text style={{ color: '#fff' }}&gt;{state.language==='de'?'Test':(state.language==='pl'?'Test':'Test')}</Text&gt;
              </TouchableOpacity&gt;
              <TouchableOpacity onPress={seedDefaults} style={[styles.badge, { borderColor: colors.muted }]}&gt;<Text style={{ color: colors.text }}&gt;{state.language==='de'?'Standard anlegen':(state.language==='pl'?'Utwórz domyślne':'Seed defaults')}</Text&gt;</TouchableOpacity&gt;
              <TouchableOpacity onPress={() =&gt; setCustomMode((v)=&gt;!v)} style={[styles.badge, { borderColor: colors.muted }]}&gt;<Text style={{ color: colors.text }}&gt;{state.language==='de'?'Eigene':(state.language==='pl'?'Własne':'Custom')}</Text&gt;</TouchableOpacity&gt;
            </View&gt;
          </View&gt;

          {/* Battery optimization hint for HyperOS/Xiaomi */}
          {showBatteryHint ? (
            <View style={{ marginTop: 10, borderWidth: 1, borderColor: colors.primary, backgroundColor: state.theme==='pink_vibrant' ? '#321321' : '#ffe3ef', borderRadius: 12, padding: 10 }}&gt;
              <Text style={{ color: colors.text, fontWeight: '700' }}&gt;{state.language==='de'?'Akku-Optimierung':(state.language==='pl'?'Optymalizacja baterii':'Battery optimization')}</Text&gt;
              <Text style={{ color: colors.muted, marginTop: 6 }}&gt;{state.language==='de'?'Bitte Akku-Optimierung für die App ausschalten, damit Erinnerungen zuverlässig ankommen.':(state.language==='pl'?'Wyłącz optymalizację baterii dla aplikacji, aby przypomnienia były niezawodne.':'Please disable battery optimization for the app to ensure reliable reminders.')}</Text&gt;
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}&gt;
                <TouchableOpacity onPress={() =&gt; Linking.openSettings()} style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.primary }]}&gt;
                  <Text style={{ color: '#fff' }}&gt;{state.language==='de'?'Einstellungen öffnen':(state.language==='pl'?'Otwórz ustawienia':'Open settings')}</Text&gt;
                </TouchableOpacity&gt;
              </View&gt;
            </View&gt;
          ) : null}

          {customMode ? (
            <View style={{ marginTop: 10 }}&gt;
              <View style={{ flexDirection: 'row', gap: 8 }}&gt;
                <TextInput placeholder={state.language==='de'?'Label':(state.language==='pl'?'Etykieta':'Label')} placeholderTextColor={colors.muted} value={customLabel} onChangeText={setCustomLabel} style={{ flex: 1, borderWidth: 1, borderColor: colors.muted, borderRadius: 8, paddingHorizontal: 10, color: colors.text, backgroundColor: colors.input }} /&gt;
                <View style={{ width: 100 }}&gt;
                  <TimePicker
                    time={customTime}
                    onTimeChange={setCustomTime}
                    colors={colors}
                    style={{ borderWidth: 1, borderColor: colors.muted, borderRadius: 8, backgroundColor: colors.input }}
                  /&gt;
                </View&gt;
              </View&gt;
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}&gt;
                <TouchableOpacity onPress={() =&gt; { setCustomMode(false); setCustomLabel(''); setCustomTime('08:00'); }} style={[styles.badge, { borderColor: colors.muted }]}&gt;<Text style={{ color: colors.text }}&gt;{state.language==='de'?'Abbrechen':(state.language==='pl'?'Anuluj':'Cancel')}</Text&gt;</TouchableOpacity&gt;
                <TouchableOpacity onPress={saveCustomReminder} style={[styles.badge, { borderColor: colors.muted, backgroundColor: colors.primary }]}&gt;<Text style={{ color: '#fff' }}&gt;{state.language==='de'?'Speichern':(state.language==='pl'?'Zapisz':'Save')}</Text&gt;</TouchableOpacity&gt;
              </View&gt;
            </View&gt;
          ) : null}
          {sortedReminders.length === 0 ? (<Text style={{ color: colors.muted, marginTop: 6 }}&gt;{state.language==='de'?'Keine Erinnerungen angelegt.':(state.language==='pl'?'Brak przypomnień.':'No reminders yet.')}</Text&gt;) : null}
          {sortedReminders.map((r) =&gt; (
            <View key={r.id} style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}&gt;
              <View style={{ flex: 1 }}&gt;
                <Text style={{ color: colors.text, fontWeight: '700' }}&gt;
                  {reminderLabel(r.type, state.language as any, r.label)}
                </Text&gt;
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}&gt;
                  <View style={{ flex: 1 }}&gt;
                    <TimePicker
                      time={reminderTimes[r.id] || '08:00'}
                      onTimeChange={(str) =&gt; updateTime(r.id, str)}
                      colors={colors}
                      style={{ width: 120, borderWidth: 1, borderColor: colors.muted, borderRadius: 8, backgroundColor: colors.input }}
                    /&gt;
                  </View&gt;
                  <View style={{ width: 8 }} /&gt;
                  <Switch value={r.enabled} onValueChange={(v)=&gt;toggleReminder(r.id, v)} thumbColor={'#fff'} trackColor={{ true: colors.primary, false: colors.muted }} /&gt;
                </View&gt;
              </View&gt;
              <TouchableOpacity onPress={async ()=&gt;{ const meta = state.notificationMeta[r.id]; if (meta?.id) await cancelNotification(meta.id); state.deleteReminder(r.id); }} style={{ padding: 8 }}&gt;
                <Ionicons name='trash' size={18} color={colors.muted} /&gt;
              </TouchableOpacity&gt;
            </View&gt;
          ))}
        </View&gt;

        {/* Debug – Notifications */}
        <View style={[styles.card, { backgroundColor: colors.card }]}&gt; 
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}&gt;
            <View style={{ flexDirection: 'row', alignItems: 'center' }}&gt;
              <Ionicons name='bug' size={18} color={colors.primary} /&gt;
              <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}&gt;Debug – Notifications</Text&gt;
            </View&gt;
            <Switch value={debugSwitch} onValueChange={(v)=&gt;{ setDebugSwitch(v); if (v) { router.push('/debug/notifications'); setTimeout(()=&gt; setDebugSwitch(false), 400); } }} thumbColor={'#fff'} trackColor={{ true: colors.primary, false: colors.muted }} /&gt;
          </View&gt;
          <Text style={{ color: colors.muted, marginTop: 6 }}&gt;Öffnet den Debug-Bildschirm, um geplante Benachrichtigungen zu prüfen oder zu löschen.</Text&gt;
        </View&gt;

        {/* App info */}
        <View style={[styles.card, { backgroundColor: colors.card }]}&gt; 
          <Text style={{ color: colors.text, fontWeight: '700' }}&gt;{state.language==='de'?'App':(state.language==='pl'?'Aplikacja':'App')}</Text&gt;
          <Text style={{ color: colors.muted, marginTop: 6 }}&gt;{state.language==='de'?'Version':(state.language==='pl'?'Wersja':'Version')}: {version}</Text&gt;
          <Text style={{ color: colors.muted, marginTop: 2 }}&gt;created by Gugi</Text&gt;
        </View&gt;
      </ScrollView&gt;
    </SafeAreaView&gt;
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appTitle: { fontSize: 18, fontWeight: '800' },
  title: { fontSize: 14, fontWeight: '600' },
  iconBtn: { padding: 8 },
  card: { borderRadius: 12, padding: 12 },
  badge: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
});