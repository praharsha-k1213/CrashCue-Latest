import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

type Props = {
  size?: number;
};

export function CurvedNextIcon({ size = 52 }: Props) {
  const center = size / 2;
  const innerIconSize = Math.round(size * 0.38);
  const strokeWidth = Math.max(2, Math.round(size * 0.038));

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#131616" />
          <Stop offset="100%" stopColor="#88908E" />
        </LinearGradient>
        <LinearGradient id="stroke" x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0%" stopColor="#000000" />
          <Stop offset="100%" stopColor="#88908E" />
        </LinearGradient>
      </Defs>

      <Circle cx={center} cy={center} r={center - 1} fill="url(#bg)" stroke="url(#stroke)" strokeWidth={1} />

      <Path
        d={`M ${center - innerIconSize * 0.9} ${center - innerIconSize * 0.1}
            q ${innerIconSize * 0.7} ${-innerIconSize * 0.8} ${innerIconSize * 1.2} ${-innerIconSize * 0.05}
            m ${-innerIconSize * 0.2} ${-innerIconSize * 0.2}
            l ${innerIconSize * 0.4} ${innerIconSize * 0.4}
            l ${-innerIconSize * 0.4} ${innerIconSize * 0.4}`}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}


