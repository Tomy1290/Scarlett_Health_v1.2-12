import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';

export type UnlockItem = { id: string; title: string; description: string };

export default function UnlockModal({ visible, onClose, items, colors }: { visible: boolean; onClose: () => void; items: UnlockItem[]; colors: any }) {
  if (!visible) return null as any;
  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ backgroundColor: colors.card, padding: 16, borderRadius: 12, width: '88%' }}>
          <Text style={{ color: colors.text, fontWeight: '800', marginBottom: 8 }}>Neue Freischaltung</Text>
          {items.map((it) => (
            <View key={it.id} style={{ marginTop: 8 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>• {it.title}</Text>
              <Text style={{ color: colors.muted, marginTop: 4 }}>{it.description}</Text>
            </View>
          ))}
          <View style={{ alignItems: 'flex-end', marginTop: 12 }}>
            <TouchableOpacity onPress={onClose} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.primary }}>
              <Text style={{ color: '#fff' }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}