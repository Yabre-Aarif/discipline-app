import React, { useMemo, useState } from "react";
import { LayoutChangeEvent, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { colors, fonts, radius } from "../theme/theme";
import { Kicker } from "../components/Kicker";
import {
  getCycleAvg,
  getCycleCells,
  getCycleDay,
  getDailyComparison,
  getLongestStreak,
  getPerfectDaysCount,
  getStreak,
} from "../context/selectors";

const GRID_COLUMNS = 10;
const GRID_GAP = 5;

export function CycleScreen() {
  const { state } = useApp();
  const [gridWidth, setGridWidth] = useState(0);
  const cellSize = gridWidth > 0 ? (gridWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS : 0;

  function onGridLayout(e: LayoutChangeEvent) {
    setGridWidth(e.nativeEvent.layout.width);
  }

  const cycleDay = getCycleDay(state);
  const daysLeft = 100 - cycleDay;
  const cells = useMemo(() => getCycleCells(state, cycleDay), [state, cycleDay]);
  const cycleAvg = getCycleAvg(cells);
  const streak = getStreak(state);
  const longestStreak = getLongestStreak(cells);
  const perfectDays = getPerfectDaysCount(cells);
  const comparison = getDailyComparison(state);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Kicker color={colors.textMuted40}>
          JOUR {String(cycleDay).padStart(3, "0")} / 100 · {daysLeft} RESTANTS
        </Kicker>
        <View style={styles.avgRow}>
          <Text style={styles.avgValue}>{cycleAvg}%</Text>
          <Text style={styles.avgSub}>de moyenne{"\n"}sur le cycle</Text>
        </View>
        <View style={styles.avgBarTrack}>
          <View style={[styles.avgBarFill, { width: `${cycleAvg}%` }]} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>série actuelle</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{longestStreak}</Text>
            <Text style={styles.statLabel}>meilleure série</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statValue, { color: colors.accent400 }]}>{perfectDays}</Text>
            <Text style={styles.statLabel}>jours parfaits</Text>
          </View>
        </View>

        <View style={styles.mapHeader}>
          <Kicker>CARTE DES 100 JOURS</Kicker>
        </View>
        <View style={styles.grid} onLayout={onGridLayout}>
          {cellSize > 0 &&
            cells.map((c, i) => (
              <View
                key={c.key + i}
                style={[
                  styles.cell,
                  {
                    width: cellSize,
                    height: cellSize,
                    backgroundColor:
                      c.score < 0 ? colors.divider10 : `rgba(145,132,217,${(0.14 + (c.score / 100) * 0.74).toFixed(2)})`,
                  },
                  c.isToday && styles.cellToday,
                ]}
              />
            ))}
        </View>

        {state.dailies.length > 0 && (
          <View style={styles.compareCard}>
            <Kicker style={{ marginBottom: 14 }}>COMPARAISON PAR OBJECTIF</Kicker>
            <View style={{ gap: 12 }}>
              {comparison.map((d) => (
                <View key={d.id} style={{ gap: 6 }}>
                  <View style={styles.compareRow}>
                    <Text style={styles.compareLabel} numberOfLines={1}>{d.label}</Text>
                    <Text style={styles.comparePct}>{d.pct}%</Text>
                  </View>
                  <View style={styles.compareBarTrack}>
                    <View style={[styles.compareBarFill, { width: `${d.pct}%` }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: 22, paddingBottom: 28 },
  avgRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, marginTop: 10 },
  avgValue: { fontFamily: fonts.bodyMedium, fontSize: 58, lineHeight: 58, letterSpacing: -1.6, color: colors.text },
  avgSub: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 18.5, color: colors.textMuted50, paddingBottom: 6 },
  avgBarTrack: { height: 2, backgroundColor: colors.divider12, marginTop: 16, overflow: "hidden" },
  avgBarFill: { height: 2, backgroundColor: colors.accent },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 22 },
  statTile: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.divider14,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceRow,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 4,
  },
  statValue: { fontFamily: fonts.bodyMedium, fontSize: 24, color: colors.text },
  statLabel: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted45 },
  mapHeader: { marginTop: 26, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GRID_GAP },
  cell: { borderRadius: 3 },
  cellToday: { borderWidth: 1, borderColor: colors.accent300 },
  compareCard: {
    marginTop: 26,
    borderWidth: 1,
    borderColor: colors.divider14,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceCard,
    padding: 16,
  },
  compareRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  compareLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14.5, color: colors.text },
  comparePct: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.textMuted50 },
  compareBarTrack: { height: 4, borderRadius: 2, backgroundColor: colors.divider12, overflow: "hidden" },
  compareBarFill: { height: 4, borderRadius: 2, backgroundColor: colors.accent600 },
});
