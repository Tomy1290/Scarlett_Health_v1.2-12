import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore, useLevel } from '../src/store/useStore';
import type { PhotoMeta } from '../src/utils/photos';

function useThemeColors(theme: string) {
  if (theme === 'pink_pastel') return { bg: '#fff0f5', card: '#ffe4ef', primary: '#d81b60', text: '#3a2f33', muted: '#8a6b75' };
  if (theme === 'pink_vibrant') return { bg: '#1b0b12', card: '#2a0f1b', primary: '#ff2d87', text: '#ffffff', muted: '#e59ab8' };
  if (theme === 'golden_pink') return { bg: '#fff8f0', card: '#ffe9c7', primary: '#dba514', text: '#2a1e22', muted: '#9b7d4e' };
  return { bg: '#fde7ef', card: '#ffd0e0', primary: '#e91e63', text: '#2a1e22', muted: '#7c5866' };
}

export default function GalleryCompare() {
  const state = useAppStore();
  const { level } = useLevel();
  const router = useRouter();
  const colors = useThemeColors(state.theme);

  const t = (key: string) => {
    const de: Record<string,string> = {
      title: 'Foto‑Vergleich A/B', selectA: 'Wähle A', selectB: 'Wähle B', swap: 'Tauschen', locked: 'Ab Level 32 verfügbar',
      chooseDate: 'Datum wählen', choosePhoto: 'Foto wählen',
    };
    const en: Record<string,string> = {
      title: 'Photo Compare A/B', selectA: 'Pick A', selectB: 'Pick B', swap: 'Swap', locked: 'Available from level 32',
      chooseDate: 'Choose date', choosePhoto: 'Choose photo',
    };
    const pl: Record<string,string> = {
      title: 'Porównanie zdjęć A/B', selectA: 'Wybierz A', selectB: 'Wybierz B', swap: 'Zamień', locked: 'Dostępne od poziomu 32',
      chooseDate: 'Wybierz datę', choosePhoto: 'Wybierz zdjęcie',
    };
    return (state.language==='en'?en:(state.language==='pl'?pl:de))[key] || key;
  };

  const daysWithPhotos = useMemo(() => {
    const out: { date: string; photos: PhotoMeta[] }[] = [];
    for (const [k, d] of Object.entries(state.days)) {
      const photos = (d as any).photos as PhotoMeta[] | undefined;
      if (photos && photos.length) out.push({ date: k, photos });
    }
    return out.sort((a,b)=> a.date.localeCompare(b.date));
  }, [state.days]);

  const defaultA = daysWithPhotos.length ? daysWithPhotos[0] : undefined;
  const defaultB = daysWithPhotos.length ? daysWithPhotos[daysWithPhotos.length - 1] : undefined;

  const [selA, setSelA] = useState<{ date: string; idx: number } | undefined>(defaultA ? { date: defaultA.date, idx: 0 } : undefined);
  const [selB, setSelB] = useState<{ date: string; idx: number } | undefined>(defaultB ? { date: defaultB.date, idx: Math.max(0, (defaultB.photos.length - 1)) } : undefined);

  const photosA = useMemo(() => daysWithPhotos.find(d => d.date === selA?.date)?.photos || [], [daysWithPhotos, selA?.date]);
  const photosB = useMemo(() => daysWithPhotos.find(d => d.date === selB?.date)?.photos || [], [daysWithPhotos, selB?.date]);

  const imgA = (photosA[selA?.idx || 0] as any) || undefined;
  const imgB = (photosB[selB?.idx || 0] as any) || undefined;

  const screenW = Dimensions.get('window').width;
  const columnW = Math.floor((screenW - 16 - 16 - 8) / 2); // padding 16 both sides + gap 8

  if (level < 32) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={[styles.header, { backgroundColor: colors.card }]}> 
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <Ionicons name='chevron-back' size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ color: colors.text, fontWeight: '800' }}>{t('title')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ padding: 16 }}>
          <Text style={{ color: colors.muted }}>{t('locked')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { backgroundColor: colors.card }]}> 
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name='chevron-back' size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontWeight: '800' }}>{t('title')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => { const a = selA; const b = selB; setSelA(b); setSelB(a); }} style={{ padding: 8 }}>
            <Ionicons name='swap-horizontal' size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* Pickers */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* A */}
          <View style={[styles.card, { backgroundColor: colors.card, flex: 1 }]}> 
            <Text style={{ color: colors.text, fontWeight: '700' }}>A</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
              {daysWithPhotos.map((row) => (
                <TouchableOpacity key={`A-${row.date}`} onPress={() => setSelA({ date: row.date, idx: 0 })} style={[styles.badge, { borderColor: (selA?.date===row.date?colors.primary:colors.muted) }]}>
                  <Text style={{ color: colors.text }}>{row.date}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {photosA.length>1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
                {photosA.map((p, i) => (
                  <TouchableOpacity key={`A-${i}`} onPress={() => setSelA(selA ? { ...selA, idx: i } : { date: '', idx: i })} style={[styles.thumbWrap, { borderColor: i===selA?.idx ? colors.primary : 'transparent' }]}> 
                    <Image source={{ uri: (p as any).thumbUri || (p as any).uri }} style={{ width: 48, height: 48, borderRadius: 8 }} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}
          </View>

          {/* B */}
          <View style={[styles.card, { backgroundColor: colors.card, flex: 1 }]}> 
            <Text style={{ color: colors.text, fontWeight: '700' }}>B</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
              {daysWithPhotos.map((row) => (
                <TouchableOpacity key={`B-${row.date}`} onPress={() => setSelB({ date: row.date, idx: 0 })} style={[styles.badge, { borderColor: (selB?.date===row.date?colors.primary:colors.muted) }]}>
                  <Text style={{ color: colors.text }}>{row.date}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {photosB.length>1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
                {photosB.map((p, i) => (
                  <TouchableOpacity key={`B-${i}`} onPress={() => setSelB(selB ? { ...selB, idx: i } : { date: '', idx: i })} style={[styles.thumbWrap, { borderColor: i===selB?.idx ? colors.primary : 'transparent' }]}> 
                    <Image source={{ uri: (p as any).thumbUri || (p as any).uri }} style={{ width: 48, height: 48, borderRadius: 8 }} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}
          </View>
        </View>

        {/* Side-by-side images */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={[styles.card, { backgroundColor: colors.card, width: columnW }]}> 
            <Text style={{ color: colors.muted }}>{selA?.date || '-'}</Text>
            <View style={{ width: '100%', aspectRatio: 3/4, borderRadius: 12, overflow: 'hidden', marginTop: 8, backgroundColor: colors.bg }}>
              {imgA ? (
                <Image source={{ uri: imgA.uri }} style={{ flex: 1 }} resizeMode='cover' />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name='images-outline' size={24} color={colors.muted} />
                </View>
              )}
            </View>
          </View>
          <View style={[styles.card, { backgroundColor: colors.card, width: columnW }]}> 
            <Text style={{ color: colors.muted }}>{selB?.date || '-'}</Text>
            <View style={{ width: '100%', aspectRatio: 3/4, borderRadius: 12, overflow: 'hidden', marginTop: 8, backgroundColor: colors.bg }}>
              {imgB ? (
                <Image source={{ uri: imgB.uri }} style={{ flex: 1 }} resizeMode='cover' />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name='images-outline' size={24} color={colors.muted} />
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { borderRadius: 12, padding: 12 },
  badge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  thumbWrap: { padding: 2, borderWidth: 2, borderRadius: 10 },
});