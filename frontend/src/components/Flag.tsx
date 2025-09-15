import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';

export default function Flag({ code, size = 28, round = true }: { code: 'de'|'en'|'pl'; size?: number; round?: boolean }) {
  const borderRadius = round ? size/6 : 4;
  if (code === 'de') {
    return (
      <View style={{ width: size, height: size*0.7, borderRadius, overflow: 'hidden' }}>
        <Svg width={'100%'} height={'100%'} viewBox={'0 0 100 70'}>
          <Rect x={0} y={0} width={100} height={70} fill={'#000'} />
          <Rect x={0} y={23} width={100} height={24} fill={'#dd0000'} />
          <Rect x={0} y={47} width={100} height={23} fill={'#ffce00'} />
        </Svg>
      </View>
    );
  }
  if (code === 'pl') {
    return (
      <View style={{ width: size, height: size*0.7, borderRadius, overflow: 'hidden' }}>
        <Svg width={'100%'} height={'100%'} viewBox={'0 0 100 70'}>
          <Rect x={0} y={0} width={100} height={35} fill={'#ffffff'} />
          <Rect x={0} y={35} width={100} height={35} fill={'#dc143c'} />
        </Svg>
      </View>
    );
  }
  // GB simplified union jack
  return (
    <View style={{ width: size, height: size*0.7, borderRadius, overflow: 'hidden' }}>
      <Svg width={'100%'} height={'100%'} viewBox={'0 0 100 70'}>
        <Rect x={0} y={0} width={100} height={70} fill={'#00247d'} />
        {/* white diagonals */}
        <Line x1={0} y1={0} x2={100} y2={70} stroke={'#ffffff'} strokeWidth={12} />
        <Line x1={0} y1={70} x2={100} y2={0} stroke={'#ffffff'} strokeWidth={12} />
        {/* red diagonals */}
        <Line x1={0} y1={0} x2={100} y2={70} stroke={'#cf142b'} strokeWidth={6} />
        <Line x1={0} y1={70} x2={100} y2={0} stroke={'#cf142b'} strokeWidth={6} />
        {/* white cross */}
        <Rect x={0} y={29} width={100} height={12} fill={'#ffffff'} />
        <Rect x={44} y={0} width={12} height={70} fill={'#ffffff'} />
        {/* red cross */}
        <Rect x={0} y={31} width={100} height={8} fill={'#cf142b'} />
        <Rect x={46} y={0} width={8} height={70} fill={'#cf142b'} />
      </Svg>
    </View>
  );
}