import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Lock, Plus } from "phosphor-react-native";
import { useApp } from "../context/AppContext";
import { useSyncActions } from "../context/syncActions";
import { colors, fonts, radius } from "../theme/theme";
import { Kicker } from "../components/Kicker";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { iconFor } from "../utils/icons";
import { getCycleDay, getDailyPct, goalProgressLabel } from "../context/selectors";

export function GoalsScreen() {
  const { state } = useApp();
  const sync = useSyncActions();
  const [draftDaily, setDraftDaily] = useState("");
  const [draftGoal, setDraftGoal] = useState("");

  const cycleDay = getCycleDay(state);
  const daysLeft = 100 - cycleDay;

  async function submitDaily() {
    const l = draftDaily.trim();
    if (!l) return;
    setDraftDaily("");
    await sync.addDaily(l).catch(console.error);
  }

  async function submitGoal() {
    const l = draftGoal.trim();
    if (!l) return;
    setDraftGoal("");
    await sync.addGoal(l).catch(console.error);
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <LinearGradient colors={["#262a60", "#1b1d3a"]} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={styles.header}>
        <Kicker color={colors.textMuted55}>CYCLE EN COURS</Kicker>
        <View style={styles.dayRow}>
          <Text style={styles.dayNumber}>{cycleDay}</Text>
          <Text style={styles.daySub}>/ 100 jours · {daysLeft} restants</Text>
        </View>
        <View style={styles.cycleBarTrack}>
          <View style={[styles.cycleBarFill, { width: `${cycleDay}%` }]} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Kicker style={{ marginBottom: 10 }}>QUOTIDIENS · {state.dailies.length}</Kicker>
        <View style={{ gap: 8 }}>
          {state.dailies.map((d) => {
            const Icon = iconFor(d.label);
            const pct = getDailyPct(state, d);
            return (
              <View key={d.id} style={styles.row}>
                <Icon size={17} color={colors.accent400} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.rowLabel} numberOfLines={1}>{d.label}</Text>
                  <Text style={styles.rowTarget} numberOfLines={1}>{d.target}</Text>
                </View>
                <Text style={styles.pctText}>{pct}%</Text>
                <Lock size={14} color={colors.textMuted30} />
              </View>
            );
          })}
        </View>
        <View style={styles.addRow}>
          <TextField
            value={draftDaily}
            onChangeText={setDraftDaily}
            placeholder="Ajouter un objectif quotidien…"
            minHeight={44}
            style={{ flex: 1 }}
          />
          <Button variant="primary" minHeight={44} style={styles.addBtn} onPress={submitDaily}>
            <Plus size={16} color={colors.accent} />
          </Button>
        </View>

        <Kicker style={{ marginTop: 26, marginBottom: 10 }}>100 JOURS · {state.goals.length}</Kicker>
        <View style={{ gap: 10 }}>
          {state.goals.map((g) => {
            const Icon = iconFor(g.label);
            return (
              <View key={g.id} style={styles.goalCard}>
                <View style={styles.rowTop}>
                  <Icon size={17} color={colors.accent400} />
                  <Text style={styles.goalLabel} numberOfLines={1}>{g.label}</Text>
                  <Lock size={14} color={colors.textMuted30} />
                </View>
                <Text style={styles.goalTarget}>{g.target}</Text>
                <View style={styles.goalProgressRow}>
                  <View style={styles.goalBarTrack}>
                    <View style={[styles.goalBarFill, { width: `${g.pct}%` }]} />
                  </View>
                  <Text style={styles.goalProgressText}>{goalProgressLabel(g, daysLeft)}</Text>
                </View>
              </View>
            );
          })}
        </View>
        <View style={styles.addRow}>
          <TextField
            value={draftGoal}
            onChangeText={setDraftGoal}
            placeholder="Ajouter un objectif 100 jours…"
            minHeight={44}
            style={{ flex: 1 }}
          />
          <Button variant="primary" minHeight={44} style={styles.addBtn} onPress={submitGoal}>
            <Plus size={16} color={colors.accent} />
          </Button>
        </View>

        <Text style={styles.footNote}>
          En mode strict, un objectif est verrouillé dès sa création : impossible de le renommer ou
          de le supprimer avant le jour 100.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingTop: 18,
    paddingHorizontal: 22,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider12,
  },
  dayRow: { flexDirection: "row", alignItems: "baseline", gap: 9, marginTop: 4 },
  dayNumber: { fontFamily: fonts.bodyMedium, fontSize: 50, letterSpacing: -1.4, color: colors.text },
  daySub: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted60 },
  cycleBarTrack: { height: 3, borderRadius: 2, backgroundColor: colors.divider16, marginTop: 14, overflow: "hidden" },
  cycleBarFill: { height: 3, borderRadius: 2, backgroundColor: colors.accent300 },
  scrollContent: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 26 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.divider12,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceRow,
  },
  rowLabel: { fontFamily: fonts.bodyMedium, fontSize: 15.5, color: colors.text },
  rowTarget: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted45 },
  pctText: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted45 },
  addRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  addBtn: { paddingHorizontal: 14 },
  goalCard: {
    borderWidth: 1,
    borderColor: colors.divider12,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceRow,
    padding: 12,
  },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  goalLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15.5, color: colors.text },
  goalTarget: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted60, marginTop: 8 },
  goalProgressRow: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 10 },
  goalBarTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.divider12, overflow: "hidden" },
  goalBarFill: { height: 4, borderRadius: 2, backgroundColor: colors.accent600 },
  goalProgressText: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted50 },
  footNote: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.textMuted40, marginTop: 18 },
});
