import React from 'react';
import { View, Text } from 'react-native';

export default function BMIBar({ bmi, language = 'de', textColor = '#333' }: { bmi: number; language?: 'de'|'en'|'pl'; textColor?: string }) {
  const min = 12; // display range
  const max = 40;
  const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
  const v = clamp(bmi, min, max);
  const range = max - min;

  const segs = [
    { from: 12, to: 18.5, color: '#42a5f5' },
    { from: 18.5, to: 25, color: '#2bb673' },
    { from: 25, to: 30, color: '#ffb300' },
    { from: 30, to: 40, color: '#e53935' },
  ];

  const markerLeftPct = ((v - min) / range) * 100;

  const label = (() => {
    if (bmi < 18.5) return language==='en'?'Underweight':(language==='pl'?'Niedowaga':'Untergewicht');
    if (bmi < 25) return language==='en'?'Normal weight':(language==='pl'?'Prawidłowa':'Normalgewicht');
    if (bmi < 30) return language==='en'?'Overweight':(language==='pl'?'Nadwaga':'Übergewicht');
    return language==='en'?'Obesity':(language==='pl'?'Otyłość':'Adipositas');
  })();

  return (
    <View>
      <View style={{ height: 12, borderRadius: 6, overflow: 'hidden', flexDirection: 'row' }}>
        {segs.map((s, i) => {
          const w = ((s.to - s.from) / range) * 100;
          return <View key={i} style={{ width: `${w}%`, backgroundColor: s.color }} />;
        })}
      </View>
      {/* Marker */}
      <View style={{ position: 'relative', height: 12 }}>
        <View style={{ position: 'absolute', left: `calc(${markerLeftPct}% - 6px)`, top: 0, width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 8, borderStyle: 'solid', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#212121' }} />
      </View>
      <Text style={{ color: textColor, marginTop: 4 }}>BMI {bmi.toFixed(1)} · {label}</Text>
    </View>
  );
}