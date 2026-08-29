import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, Plus, WarningOctagon } from "phosphor-react-native";
import { useApp } from "../context/AppContext";
import { useSyncActions } from "../context/syncActions";
import { colors, fonts, radius } from "../theme/theme";
import { Kicker } from "../components/Kicker";
import { ProgressRing } from "../components/ProgressRing";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { iconFor } from "../utils/icons";
import { getDailyQuote } from "../content/motivationalQuotes";
import {
  getCycleDay,
  getCycleTicks,
  getDoneCount,
  getStreak,
  getTodayChecks,
  getWeek,
  getWeekAvg,
  goalProgressLabel,
} from "../context/selectors";

export function HomeScreen() {
  const { state } = useApp();
  const sync = useSyncActions();
  const [adding, setAdding] = useState(false);
  const [draftDaily, setDraftDaily] = useState("");
  const [addingGoal, setAddingGoal] = useState(false);
  const [draftGoal, setDraftGoal] = useState("");

  const cycleDay = getCycleDay(state);
  const daysLeft = 100 - cycleDay;
  const checks = getTodayChecks(state);
  const { done, total } = getDoneCount(state);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const week = useMemo(() => getWeek(state), [state]);
  const weekAvg = getWeekAvg(week);
  const streak = getStreak(state);
  const ticks = getCycleTicks(cycleDay);
  const missCount = total - done;
  const quote = useMemo(() => getDailyQuote(cycleDay), [cycleDay]);

  async function submitDaily() {
    const l = draftDaily.trim();
    if (!l) {
      setAdding(true);
      return;
    }
    setDraftDaily("");
    setAdding(false);
    await sync.addDaily(l).catch(console.error);
  }

  async function submitGoal() {
    const l = draftGoal.trim();
    if (!l) {
      setAddingGoal(true);
      return;
    }
    setDraftGoal("");
    setAddingGoal(false);
    await sync.addGoal(l).catch(console.error);
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Kicker color={colors.accent400}>JOUR {String(cycleDay).padStart(3, "0")} / 100</Kicker>
          <Text style={styles.title}>Rapport du jour</Text>
        </View>
        <ProgressRing pct={pct} label={`${pct}%`} />
      </View>

      <View style={styles.ticksRow}>
        {ticks.map((t, i) => (
          <View key={i} style={[styles.tick, { backgroundColor: t.filled ? colors.accent : colors.divider14 }]} />
        ))}
      </View>

      <View style={styles.quoteRow}>
        <Text style={styles.quoteText}>{quote}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {state.dailies.map((d) => {
            const Icon = iconFor(d.label);
            const isDone = !!checks[d.id];
            return (
              <Pressable
                key={d.id}
                onPress={() => sync.toggleDailyToday(d.id)}
                style={[styles.tile, isDone && styles.tileDone]}
              >
                <Icon size={24} color={colors.accent400} />
                <View style={{ gap: 3, width: "100%" }}>
                  <Text style={styles.tileLabel} numberOfLines={1}>{d.label}</Text>
                  <Text style={styles.tileTarget} numberOfLines={1}>{d.target}</Text>
                </View>
                {isDone && (
                  <View style={styles.tileCheck}>
                    <Check size={15} color={colors.bg} />
                  </View>
                )}
              </Pressable>
            );
          })}
          <Pressable style={styles.addTile} onPress={() => setAdding(true)}>
            <Plus size={22} color={colors.textMuted50} />
            <Text style={styles.addTileLabel}>Ajouter</Text>
          </Pressable>
        </View>

        {adding && (
          <View style={styles.addRow}>
            <TextField
              value={draftDaily}
              onChangeText={setDraftDaily}
              placeholder="Nom de l'objectif quotidien…"
              minHeight={44}
              style={{ flex: 1 }}
            />
            <Button label="OK" minHeight={44} style={styles.okBtn} onPress={submitDaily} />
          </View>
        )}

        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Kicker>DISCIPLINE · 7 DERNIERS JOURS</Kicker>
            <Text style={styles.weekAvg}>{weekAvg}% moy.</Text>
          </View>
          <View style={styles.weekChart}>
            {week.map((d) => (
              <View key={d.key} style={styles.weekBarCol}>
                <View
                  style={[
                    styles.weekBar,
                    {
                      height: Math.max(4, Math.round(d.pct * 0.98)),
                      backgroundColor: d.isToday ? colors.accent : "#3d3f56",
                    },
                  ]}
                />
                <Text style={[styles.weekBarLabel, { color: d.isToday ? colors.accent400 : colors.textMuted40 }]}>
                  {d.letter}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.statsFooter}>
            <View>
              <Text style={styles.statValue}>{streak}</Text>
              <Text style={styles.statLabel}>série</Text>
            </View>
            <View>
              <Text style={styles.statValue}>{done}/{total}</Text>
              <Text style={styles.statLabel}>exécutés</Text>
            </View>
            <View>
              <Text style={[styles.statValue, { color: colors.accent400 }]}>{daysLeft}</Text>
              <Text style={styles.statLabel}>jours restants</Text>
            </View>
          </View>
        </View>

        <View style={styles.goalsCard}>
          <Kicker style={{ marginBottom: 14 }}>OBJECTIFS 100 JOURS</Kicker>
          <View style={{ gap: 14 }}>
            {state.goals.map((g) => {
              const Icon = iconFor(g.label);
              return (
                <View key={g.id} style={{ gap: 7 }}>
                  <View style={styles.goalRow}>
                    <View style={styles.goalRowLeft}>
                      <Icon size={15} color={colors.accent400} />
                      <Text style={styles.goalLabel}>{g.label}</Text>
                    </View>
                    <Text style={styles.goalProgress}>{goalProgressLabel(g, daysLeft)}</Text>
                  </View>
                  <View style={styles.goalBarTrack}>
                    <View style={[styles.goalBarFill, { width: `${g.pct}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>
          <Button
            variant="secondary"
            dashed
            block
            minHeight={40}
            style={{ marginTop: 16 }}
            onPress={() => setAddingGoal(true)}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Plus size={14} color={colors.textMuted65} />
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted65 }}>
                OBJECTIF 100 JOURS
              </Text>
            </View>
          </Button>
          {addingGoal && (
            <View style={[styles.addRow, { marginTop: 10 }]}>
              <TextField
                value={draftGoal}
                onChangeText={setDraftGoal}
                placeholder="ex. Lire 10 livres"
                minHeight={42}
                style={{ flex: 1 }}
              />
              <Button label="OK" minHeight={42} style={styles.okBtn} onPress={submitGoal} />
            </View>
          )}
        </View>

        <View style={styles.hardBanner}>
          <WarningOctagon size={19} color={colors.accent400} />
          <Text style={styles.hardBannerText}>
            Mode strict : {missCount} objectifs encore ouverts. Objectifs verrouillés jusqu'au jour 100.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingTop: 16, paddingHorizontal: 22, paddingBottom: 12 },
  title: { fontFamily: fonts.bodyMedium, fontSize: 28, letterSpacing: -0.5, color: colors.text, marginTop: 5 },
  ticksRow: { flexDirection: "row", gap: 3, paddingHorizontal: 22, paddingBottom: 14 },
  tick: { flex: 1, height: 5, borderRadius: 1 },
  quoteRow: { paddingHorizontal: 22, paddingBottom: 18 },
  quoteText: {
    fontFamily: fonts.body,
    fontStyle: "italic",
    fontSize: 13.5,
    lineHeight: 19.5,
    color: colors.textMuted55,
  },
  scrollContent: { paddingHorizontal: 22, paddingBottom: 28 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: {
    width: "47%",
    aspectRatio: 1,
    justifyContent: "space-between",
    padding: 15,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.divider14,
    backgroundColor: "#1f2130",
    overflow: "hidden",
  },
  tileDone: { borderColor: colors.accent, backgroundColor: colors.accentSoft15 },
  tileLabel: { fontFamily: fonts.bodyMedium, fontSize: 16, letterSpacing: -0.2, color: colors.text },
  tileTarget: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted45 },
  tileCheck: {
    position: "absolute",
    top: 13,
    right: 13,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  addTile: {
    width: "47%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.divider22,
  },
  addTileLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted50 },
  addRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  okBtn: { paddingHorizontal: 14 },
  statsCard: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.divider14,
    borderRadius: radius.xl,
    padding: 18,
    paddingBottom: 14,
    backgroundColor: "#1c1e2c",
  },
  statsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  weekAvg: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.accent400 },
  weekChart: { flexDirection: "row", alignItems: "flex-end", gap: 9, height: 112, marginTop: 16 },
  weekBarCol: { flex: 1, alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" },
  weekBar: { width: "100%", borderRadius: 5, minHeight: 4 },
  weekBarLabel: { fontFamily: fonts.mono, fontSize: 12 },
  statsFooter: { flexDirection: "row", gap: 18, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.divider12 },
  statValue: { fontFamily: fonts.bodyMedium, fontSize: 21, color: colors.text },
  statLabel: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted45 },
  goalsCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.divider14,
    borderRadius: radius.xl,
    padding: 16,
    paddingBottom: 14,
    backgroundColor: colors.surfaceCard,
  },
  goalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  goalRowLeft: { flexDirection: "row", alignItems: "center", gap: 7 },
  goalLabel: { fontFamily: fonts.bodyMedium, fontSize: 14.5, color: colors.text },
  goalProgress: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.textMuted50 },
  goalBarTrack: { height: 4, borderRadius: 2, backgroundColor: colors.divider12, overflow: "hidden" },
  goalBarFill: { height: 4, borderRadius: 2, backgroundColor: colors.accent },
  hardBanner: {
    marginTop: 12,
    flexDirection: "row",
    gap: 11,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.accentBorder35,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.accentSoft07,
  },
  hardBannerText: { flex: 1, fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.textMuted70 },
});
