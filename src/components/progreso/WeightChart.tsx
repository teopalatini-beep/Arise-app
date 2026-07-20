import React, { memo, useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, G, Line, LinearGradient as SvgGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { COLORS, FONT, SPACING } from '../../theme';

const SCREEN_W = Dimensions.get('window').width - SPACING.md * 2;

interface WeightChartProps {
  data: { x: number; y: number }[];
  initialWeight?: number;
  targetWeight?: number;
  currentDay: number;
  track?: string;
  sourceLabel?: string;
}

function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 };
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function WeightChartImpl({ data, initialWeight, targetWeight, currentDay, track, sourceLabel }: WeightChartProps) {
  const W = SCREEN_W - 16;
  const H = 140;
  const pad = { top: 16, bottom: 28, left: 38, right: 16 };
  const plotW = W - pad.left - pad.right;
  const plotH = H;
  const losing = track === 'fat_loss' || track === 'recomposition';

  const chart = useMemo(() => {
    if (data.length < 2) return null;

    const { slope, intercept } = linearRegression(data);
    const proj90 = slope * 90 + intercept;
    const latestWeight = data[data.length - 1].y;
    const firstWeight = data[0].y;
    const delta = latestWeight - firstWeight;
    const weeklyRate = data.length > 1 ? (delta / ((data[data.length - 1].x - data[0].x) / 7)) : 0;

    const allY = [firstWeight, latestWeight, proj90, targetWeight ?? latestWeight];
    const minY = Math.min(...allY) - 1.5;
    const maxY = Math.max(...allY) + 1.5;
    const rangeY = maxY - minY || 1;

    const toX = (day: number) => pad.left + ((day - 1) / 89) * plotW;
    const toY = (kg: number) => pad.top + plotH - ((kg - minY) / rangeY) * plotH;

    const measuredPath = data
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.x).toFixed(1)},${toY(p.y).toFixed(1)}`)
      .join(' ');
    const areaPath = `${measuredPath} L${toX(data[data.length - 1].x).toFixed(1)},${(pad.top + plotH).toFixed(1)} L${toX(data[0].x).toFixed(1)},${(pad.top + plotH).toFixed(1)} Z`;

    const trendX1 = toX(data[0].x);
    const trendY1 = toY(slope * data[0].x + intercept);
    const trendX2 = toX(90);
    const trendY2 = toY(proj90);
    const yTicks = [minY + 1, (minY + maxY) / 2, maxY - 1].map(v => Math.round(v * 2) / 2);

    const targetProgress = (() => {
      if (targetWeight == null || initialWeight == null) return null;
      const totalDelta = targetWeight - initialWeight;
      const done = Math.abs(totalDelta) < 0.1 ? 1 : Math.max(0, Math.min(1, (latestWeight - initialWeight) / totalDelta));
      const pct = Math.round(done * 100);
      return { pct, color: losing ? COLORS.success : COLORS.warning };
    })();

    return {
      slope,
      intercept,
      proj90,
      latestWeight,
      firstWeight,
      delta,
      weeklyRate,
      minY,
      maxY,
      toX,
      toY,
      measuredPath,
      areaPath,
      trendX1,
      trendY1,
      trendX2,
      trendY2,
      yTicks,
      targetProgress,
    };
  }, [data, initialWeight, targetWeight, losing, plotH, plotW]);

  if (!chart) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="scale-outline" size={32} color={COLORS.textMuted} />
        <Text style={styles.emptyText}>
          Registrá tu peso diariamente{'\n'}para ver la evolución y proyección
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Svg width={W} height={H + pad.top + pad.bottom}>
        <Defs>
          <SvgGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLORS.accent} stopOpacity="0.25" />
            <Stop offset="1" stopColor={COLORS.accent} stopOpacity="0.02" />
          </SvgGradient>
        </Defs>

        {chart.yTicks.map((v, i) => (
          <G key={i}>
            <Line
              x1={pad.left}
              y1={chart.toY(v)}
              x2={W - pad.right}
              y2={chart.toY(v)}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
            <SvgText x={pad.left - 4} y={chart.toY(v) + 3} textAnchor="end" fontSize="9" fill={COLORS.textMuted}>
              {v.toFixed(1)}
            </SvgText>
          </G>
        ))}

        {targetWeight != null && (
          <G>
            <Line
              x1={pad.left}
              y1={chart.toY(targetWeight)}
              x2={W - pad.right}
              y2={chart.toY(targetWeight)}
              stroke={losing ? COLORS.success : COLORS.warning}
              strokeWidth="1.5"
              strokeDasharray="5,4"
            />
            <SvgText x={W - pad.right + 2} y={chart.toY(targetWeight) + 3} fontSize="8" fill={losing ? COLORS.success : COLORS.warning}>
              Meta
            </SvgText>
          </G>
        )}

        <Line
          x1={chart.trendX1}
          y1={chart.trendY1}
          x2={chart.trendX2}
          y2={chart.trendY2}
          stroke={COLORS.accent}
          strokeWidth="1.5"
          strokeDasharray="6,4"
          opacity={0.5}
        />

        <Path d={chart.areaPath} fill="url(#wGrad)" />
        <Path d={chart.measuredPath} stroke={COLORS.accent} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        <Circle cx={chart.toX(data[0].x)} cy={chart.toY(data[0].y)} r={3.5} fill={COLORS.accent} opacity={0.7} />
        <Circle cx={chart.toX(data[data.length - 1].x)} cy={chart.toY(data[data.length - 1].y)} r={5} fill={COLORS.accent} />
        <Circle cx={chart.toX(90)} cy={chart.toY(chart.proj90)} r={4} fill={COLORS.accent} opacity={0.4} strokeDasharray="3,2" stroke={COLORS.accent} strokeWidth="1" />

        <SvgText x={chart.toX(data[0].x)} y={H + pad.top + pad.bottom - 2} textAnchor="middle" fontSize="9" fill={COLORS.textMuted}>D{data[0].x}</SvgText>
        <SvgText x={chart.toX(currentDay)} y={H + pad.top + pad.bottom - 2} textAnchor="middle" fontSize="9" fill={COLORS.accent}>Hoy</SvgText>
        <SvgText x={chart.toX(90)} y={H + pad.top + pad.bottom - 2} textAnchor="middle" fontSize="9" fill={COLORS.textMuted}>D90</SvgText>
      </Svg>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statVal}>{chart.latestWeight.toFixed(1)} kg</Text>
          <Text style={styles.statLabel}>Actual</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: chart.delta === 0 ? COLORS.textMuted : (losing ? (chart.delta < 0 ? COLORS.success : COLORS.danger) : (chart.delta > 0 ? COLORS.success : COLORS.danger)) }]}>
            {chart.delta >= 0 ? '+' : ''}{chart.delta.toFixed(1)} kg
          </Text>
          <Text style={styles.statLabel}>Vs inicio</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statVal}>{chart.weeklyRate >= 0 ? '+' : ''}{chart.weeklyRate.toFixed(2)} kg/sem</Text>
          <Text style={styles.statLabel}>Velocidad</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: COLORS.accent }]}>{chart.proj90.toFixed(1)} kg</Text>
          <Text style={styles.statLabel}>Proy. D90</Text>
        </View>
      </View>

      {chart.targetProgress && targetWeight != null && initialWeight != null && (
        <View style={styles.targetRow}>
          <Text style={styles.targetLabel}>Meta: {initialWeight.toFixed(1)} → {targetWeight.toFixed(1)} kg</Text>
          <Text style={[styles.targetPct, { color: chart.targetProgress.color }]}>{chart.targetProgress.pct}%</Text>
        </View>
      )}
      {sourceLabel ? (
        <Text style={styles.sourceLabel}>Fuente: {sourceLabel}</Text>
      ) : null}
    </View>
  );
}

const WeightChart = memo(WeightChartImpl);
export default WeightChart;

const styles = StyleSheet.create({
  emptyWrap: { alignItems: 'center', paddingVertical: SPACING.xl, gap: 8 },
  emptyText: { color: COLORS.textMuted, fontSize: FONT.sm, textAlign: 'center' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm, paddingHorizontal: 4 },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: FONT.sm, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 9, color: COLORS.textMuted, marginTop: 2, fontWeight: '600' },
  divider: { width: 1, height: 28, backgroundColor: COLORS.border },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  targetLabel: { fontSize: FONT.xs, color: COLORS.textMuted },
  targetPct: { fontSize: FONT.sm, fontWeight: '900' },
  sourceLabel: { marginTop: 6, fontSize: FONT.xs, color: COLORS.textMuted, textAlign: 'right' },
});
