import React, { memo, useMemo } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT, SPACING } from '../../theme';
import { DayRecord } from '../../types';

const SCREEN_W = Dimensions.get('window').width - SPACING.md * 2;

interface HeatmapProps {
  days: DayRecord[];
  currentDay: number;
  onDayPress: (dayNum: number) => void;
  metricDays?: number[];
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} />
      <Text style={{ fontSize: 9, color: COLORS.textMuted }}>{label}</Text>
    </View>
  );
}

function HeatmapImpl({ days, currentDay, onDayPress, metricDays = [] }: HeatmapProps) {
  const cols = 10;
  const cellSize = Math.floor((SCREEN_W - 16) / cols);
  const gap = 3;
  const recordsByDay = useMemo(() => new Map(days.map(d => [d.dayNumber, d])), [days]);
  const metricDaysSet = useMemo(() => new Set(metricDays), [metricDays]);

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
        {Array.from({ length: 90 }, (_, i) => {
          const dayNum = i + 1;
          const record = recordsByDay.get(dayNum);
          const isPast = dayNum < currentDay;
          const isToday = dayNum === currentDay;
          const isFuture = dayNum > currentDay;

          let bg = 'rgba(255,255,255,0.05)';
          if (isToday) bg = COLORS.accent;
          else if (record?.completed || metricDaysSet.has(dayNum)) bg = COLORS.success;
          else if (record?.missed) bg = COLORS.danger;
          else if (isPast) bg = 'rgba(255,255,255,0.12)';

          const tappable = !isFuture;

          return (
            <TouchableOpacity
              key={dayNum}
              onPress={() => tappable && onDayPress(dayNum)}
              activeOpacity={tappable ? 0.7 : 1}
              style={[
                styles.cell,
                { width: cellSize - gap, height: cellSize - gap, backgroundColor: bg },
                isToday && styles.cellToday,
              ]}
            >
              {isToday && <Text style={styles.cellText}>{dayNum}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.legend}>
        <LegendDot color={COLORS.success} label="Completado / Registrado" />
        <LegendDot color={COLORS.accent} label="Hoy" />
        <LegendDot color={COLORS.danger} label="Fallado" />
        <LegendDot color="rgba(255,255,255,0.12)" label="Pendiente" />
      </View>
    </View>
  );
}

const Heatmap = memo(HeatmapImpl);
export default Heatmap;

const styles = StyleSheet.create({
  container: { width: '100%' },
  cell: { borderRadius: 3 },
  cellToday: { borderWidth: 1.5, borderColor: '#fff' },
  cellText: { fontSize: 7, color: '#fff', textAlign: 'center', lineHeight: 14 },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm, flexWrap: 'wrap', gap: 4 },
});
