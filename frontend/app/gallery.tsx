import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '../src/store/useStore';
import { pickAndCompress, captureAndCompress, deletePhoto, PhotoMeta } from '../src/utils/photos';
import { toKey } from '../src/utils/date';

function useThemeColors(theme: string) {
  if (theme === 'pink_pastel') return { bg: '#fff0f5', card: '#ffe4ef', primary: '#d81b60', text: '#3a2f33', muted: '#8a6b75' };
  if (theme === 'pink_vibrant') return { bg: '#1b0b12', card: '#2a0f1b', primary: '#ff2d87', text: '#ffffff', muted: '#e59ab8' };
  if (theme === 'golden_pink') return { bg: '#fff8f0', card: '#ffe9c7', primary: '#dba514', text: '#2a1e22', muted: '#9b7d4e' };
  return { bg: '#fde7ef', card: '#ffd0e0', primary: '#e91e63', text: '#2a1e22', muted: '#7c5866' };
}

export default function GalleryScreen() {
  const state = useAppStore();
  const router = useRouter();
  const colors = useThemeColors(state.theme);

  const daysWithPhotos = useMemo(() => {
    const out: { date: string; photos: PhotoMeta[] }[] = [];
    for (const [k, d] of Object.entries(state.days)) {
      const photos = (d as any).photos as PhotoMeta[] | undefined;
      if (photos && photos.length) out.push({ date: k, photos });
    }
    return out.sort((a,b)=> a.date.localeCompare(b.date)).reverse();
  }, [state.days]);

  async function addPhotoForToday(from: 'camera'|'gallery') {
    const key = toKey(new Date());
    const current = state.days[key] || { date: key, pills: { morning: false, evening: false }, drinks: { water: 0, coffee: 0, slimCoffee: false, gingerGarlicTea: false, waterCure: false, sport: false }, xpToday: {}, activityLog: [], photos: [] } as any;
    const list: PhotoMeta[] = Array.isArray((current as any).photos) ? ([...(current as any).photos] as any) : [];
    if (list.length >= 5) return;
    const meta = from==='camera' ? await captureAndCompress() : await pickAndCompress();
    if (!meta) return;
    list.push(meta);
    if (list.length > 5) list.splice(5); // cap to 5
    const next = { ...current, photos: list };
    const days = { ...state.days, [key]: next } as any;
    useAppStore.setState({ days });
  }

  async function removePhoto(date: string, idx: number) {
    const d = state.days[date] as any;
    const list = Array.isArray(d?.photos) ? [...d.photos] as PhotoMeta[] : [];
    const rm = list.splice(idx, 1)[0];
    const next = { ...d, photos: list };
    const days = { ...state.days, [date]: next } as any;
    useAppStore.setState({ days });
    if (rm) await deletePhoto(rm);
  }

  const t = (key: string) => { const de: Record<string,string> = { title: 'Galerie', add: 'Hinzufügen', none: 'Keine Fotos vorhanden.', today: 'Heute', camera: 'Kamera', gallery: 'Galerie' }; const en: Record<string,string> = { title: 'Gallery', add: 'Add', none: 'No photos yet.', today: 'Today', camera: 'Camera', gallery: 'Gallery' }; const pl: Record<string,string> = { title: 'Galeria', add: 'Dodaj', none: 'Brak zdjęć.', today: 'Dziś', camera: 'Aparat', gallery: 'Galeria' }; return (state.language==='en'?en:(state.language==='pl'?pl:de))[key] || key; };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { backgroundColor: colors.card }]}> 
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name='chevron-back' size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontWeight: '800' }}>{t('title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={[styles.card, { backgroundColor: colors.card }]}> 
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{t('today')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => addPhotoForToday('camera')} style={[styles.badge, { borderColor: colors.muted }]}><Text style={{ color: colors.text }}>{t('camera')}</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => addPhotoForToday('gallery')} style={[styles.badge, { borderColor: colors.muted }]}><Text style={{ color: colors.text }}>{t('gallery')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>

        {daysWithPhotos.length === 0 ? (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.muted }}>{t('none')}</Text>
          </View>
        ) : null}

        {daysWithPhotos.map((row) => (
          <View key={row.date} style={[styles.card, { backgroundColor: colors.card }]}> 
            <Text style={{ color: colors.text, fontWeight: '700' }}>{row.date}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {row.photos.map((p, idx) => (
                <View key={idx} style={{ width: '31%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                  <Image source={{ uri: p.thumbUri || p.uri }} style={{ flex: 1 }} />
                  <TouchableOpacity onPress={() => removePhoto(row.date, idx)} style={{ position: 'absolute', right: 6, top: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4 }}>
                    <Ionicons name='trash' size={14} color='#fff' />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ header: { paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, card: { borderRadius: 12, padding: 12 }, badge: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 } });