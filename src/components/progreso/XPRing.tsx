import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { COLORS, FONT } from '../../theme';

interface XPRingProps {
  xp: number;
  level: number;
  xpForLevel: (level: number) => number;
}

function XPRingImpl({ xp, level, xpForLevel }: XPRingProps) {
  const size = 120;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const xpCurrent = xpForLevel(level);
  const xpNext = xpForLevel(level + 1);
  const progress = Math.min((xp - xpCurrent) / (xpNext - xpCurrent), 1);
  const dashOffset = circumference * (1 - progress);

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="xpGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={COLORS.accent} />
            <Stop offset="1" stopColor={COLORS.purple} />
          </SvgGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#xpGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.level}>{level}</Text>
        <Text style={styles.levelLabel}>NIV</Text>
      </View>
    </View>
  );
}

const XPRing = memo(XPRingImpl);
export default XPRing;

const styles = StyleSheet.create({
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  level: { fontSize: FONT.xxl, fontWeight: '900', color: COLORS.textPrimary },
  levelLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 1 },
});
