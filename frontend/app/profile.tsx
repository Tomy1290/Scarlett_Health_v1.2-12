import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppStore } from '../src/store/useStore';
import { computeBMI, bmiCategory } from '../src/analytics/stats';

function useThemeColors(theme: string) {
  if (theme === 'pink_pastel') return { bg: '#fff0f5', card: '#ffe4ef', primary: '#d81b60', text: '#3a2f33', muted: '#8a6b75', input: '#fff' };
  if (theme === 'pink_vibrant') return { bg: '#1b0b12', card: '#2a0f1b', primary: '#ff2d87', text: '#ffffff', muted: '#e59ab8', input: '#1f1520' };
  if (theme === 'golden_pink') return { bg: '#fff8f0', card: '#ffe9c7', primary: '#dba514', text: '#2a1e22', muted: '#9b7d4e', input: '#fff' };
  return { bg: '#fde7ef', card: '#ffd0e0', primary: '#e91e63', text: '#2a1e22', muted: '#7c5866', input: '#ffffff' };
}

export default function ProfileScreen() {
  const state = useAppStore();
  const router = useRouter();
  const colors = useThemeColors(state.theme);

  const [name, setName] = useState(state.name || '');
  const [birth, setBirth] = useState(state.birthDate ? new Date(state.birthDate) : new Date(2000,0,1));
  const [showBirth, setShowBirth] = useState(false);
  const [gender, setGender] = useState(state.gender || 'female');
  const [height, setHeight] = useState(state.heightCm ? String(state.heightCm) : '');
  const [avatar, setAvatar] = useState(state.avatarUri || '');

  const latestWeight = useMemo(() => {
    const arr = Object.values(state.days).filter((d)=> typeof d.weight === 'number' && d.date).sort((a: any, b: any)=> String(a.date).localeCompare(String(b.date)));
    return arr.length ? Number((arr[arr.length-1] as any).weight) : undefined;
  }, [state.days]);

  const bmi = computeBMI(Number(height), latestWeight);
  const bmiCat = bmiCategory(bmi, state.language as any);

  const t = (key: string) => {
    const de: Record<string,string> = { profile: 'Profil', save: 'Speichern', name: 'Name', birth: 'Geburtsdatum', gender: 'Geschlecht', female: 'Weiblich', male: 'Männlich', other: 'Divers', height: 'Größe (cm)', avatar: 'Avatar', pick: 'Auswählen', remove: 'Entfernen', bmi: 'BMI', }; 
    const en: Record<string,string> = { profile: 'Profile', save: 'Save', name: 'Name', birth: 'Birthdate', gender: 'Gender', female: 'Female', male: 'Male', other: 'Other', height: 'Height (cm)', avatar: 'Avatar', pick: 'Pick', remove: 'Remove', bmi: 'BMI', };
    const pl: Record<string,string> = { profile: 'Profil', save: 'Zapisz', name: 'Imię', birth: 'Data urodzenia', gender: 'Płeć', female: 'Kobieta', male: 'Mężczyzna', other: 'Inna', height: 'Wzrost (cm)', avatar: 'Avatar', pick: 'Wybierz', remove: 'Usuń', bmi: 'BMI', };
    const map = state.language==='en'?en:(state.language==='pl'?pl:de); return map[key] || key;
  };

  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true, aspect: [1,1] });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setAvatar(res.assets[0].uri);
    }
  }

  function save() {
    const h = parseInt((height||'').replace(/[^0-9]/g,''), 10);
    useAppStore.setState({ name: name.trim() || undefined, birthDate: birth ? `${birth.getFullYear()}-${String(birth.getMonth()+1).padStart(2,'0')}-${String(birth.getDate()).padStart(2,'0')}` : undefined, gender, heightCm: (isNaN(h)||h<=0)?undefined:h, avatarUri: avatar || undefined });
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[styles.header, { backgroundColor: colors.card }]}> 
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <Ionicons name='chevron-back' size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ color: colors.text, fontWeight: '800' }}>{t('profile')}</Text>
          <TouchableOpacity onPress={save} style={{ padding: 8 }}>
            <Ionicons name='save' size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {/* Avatar */}
          <View style={[styles.card, { backgroundColor: colors.card, alignItems: 'center' }]}> 
            <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {avatar ? (<Image source={{ uri: avatar }} style={{ width: 120, height: 120 }} />) : (<Ionicons name='person' size={56} color={colors.muted} />)}
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TouchableOpacity onPress={pickAvatar} style={[styles.badge, { borderColor: colors.muted }]}><Text style={{ color: colors.text }}>{t('pick')}</Text></TouchableOpacity>
              {avatar ? (<TouchableOpacity onPress={()=> setAvatar('')} style={[styles.badge, { borderColor: colors.muted }]}><Text style={{ color: colors.text }}>{t('remove')}</Text></TouchableOpacity>) : null}
            </View>
          </View>

          {/* Name */}
          <View style={[styles.card, { backgroundColor: colors.card }]}> 
            <Text style={{ color: colors.text, fontWeight: '700' }}>{t('name')}</Text>
            <TextInput value={name} onChangeText={setName} placeholder='Gugi' placeholderTextColor={colors.muted} style={{ borderWidth: 1, borderColor: colors.muted, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: colors.text, marginTop: 8, backgroundColor: colors.input }} />
          </View>

          {/* Birthdate & Gender */}
          <View style={[styles.card, { backgroundColor: colors.card }]}> 
            <Text style={{ color: colors.text, fontWeight: '700' }}>{t('birth')}</Text>
            <TouchableOpacity onPress={()=> setShowBirth(true)} style={[styles.badge, { borderColor: colors.muted, marginTop: 8 }]}><Text style={{ color: colors.text }}>{birth.toLocaleDateString()}</Text></TouchableOpacity>
            {showBirth ? (<DateTimePicker value={birth} mode='date' onChange={(e,d)=>{ setShowBirth(false); if (d) setBirth(d); }} />) : null}
            <View style={{ height: 12 }} />
            <Text style={{ color: colors.text, fontWeight: '700' }}>{t('gender')}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              {(['female','male','other'] as const).map((g) => (
                <TouchableOpacity key={g} onPress={() => setGender(g)} style={[styles.badge, { borderColor: colors.muted, backgroundColor: gender===g?colors.primary:'transparent' }]}>
                  <Text style={{ color: gender===g?'#fff':colors.text }}>{t(g)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Height (BMI) */}
          <View style={[styles.card, { backgroundColor: colors.card }]}> 
            <Text style={{ color: colors.text, fontWeight: '700' }}>{t('height')}</Text>
            <TextInput value={height} onChangeText={setHeight} keyboardType='number-pad' placeholder='170' placeholderTextColor={colors.muted} style={{ borderWidth: 1, borderColor: colors.muted, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: colors.text, marginTop: 8, backgroundColor: colors.input }} />
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: colors.muted }}>{t('bmi')}: {typeof bmi==='number' ? bmi.toFixed(1) : '—'} {bmiCat.label ? `· ${bmiCat.label}` : ''}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ header: { paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, card: { borderRadius: 12, padding: 12 }, badge: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 } });
