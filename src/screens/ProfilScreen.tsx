import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, CalendarBlank } from "phosphor-react-native";
import { useApp } from "../context/AppContext";
import { useSyncActions } from "../context/syncActions";
import { colors, fonts, radius } from "../theme/theme";
import { Kicker } from "../components/Kicker";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { getCycleDay } from "../context/selectors";
import { addDays, formatFrenchDate, parseDateKey } from "../utils/date";
import { confirmAction } from "../utils/confirm";

export function ProfilScreen() {
  const { state } = useApp();
  const sync = useSyncActions();
  const cycleDay = getCycleDay(state);
  const daysLeft = 100 - cycleDay;
  const initial = state.user.name.trim().charAt(0).toUpperCase() || "?";

  const startDate = state.cycleStartDate ? parseDateKey(state.cycleStartDate) : null;
  const endDate = startDate ? addDays(startDate, 99) : null;

  function confirmReset() {
    confirmAction({
      title: "Recommencer un nouveau cycle ?",
      message:
        "Tes objectifs, ton historique et ta progression seront définitivement effacés. Un nouveau cycle de 100 jours commencera à zéro.",
      confirmLabel: "Recommencer",
      destructive: true,
      onConfirm: () => sync.reset().catch(console.error),
    });
  }

  function confirmLogout() {
    confirmAction({
      title: "Se déconnecter ?",
      message: "Tes données restent sauvegardées — tu pourras te reconnecter avec ton e-mail.",
      confirmLabel: "Se déconnecter",
      onConfirm: sync.logout,
    });
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1, gap: 10 }}>
            <TextField
              label="Nom"
              value={state.user.name}
              onChangeText={(v) => sync.setUserField("name", v)}
              onBlur={() => sync.syncUserField("name", state.user.name)}
              minHeight={38}
              fontSize={16}
            />
            <TextField
              label="Adresse e-mail"
              value={state.user.email}
              onChangeText={(v) => sync.setUserField("email", v)}
              onBlur={() => sync.syncUserField("email", state.user.email)}
              keyboardType="email-address"
              autoCapitalize="none"
              minHeight={38}
              fontSize={14.5}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Kicker style={{ marginBottom: 14 }}>CYCLE EN COURS</Kicker>
          <View style={styles.cardRow}>
            <CalendarBlank size={17} color={colors.accent400} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardRowLabel}>Jour {cycleDay} / 100</Text>
              <Text style={styles.cardRowSub}>
                {startDate ? formatFrenchDate(startDate) : "—"} → {endDate ? formatFrenchDate(endDate) : "—"}
              </Text>
            </View>
            <Text style={styles.daysLeft}>{daysLeft} j. restants</Text>
          </View>
          <View style={styles.cardBarTrack}>
            <View style={[styles.cardBarFill, { width: `${cycleDay}%` }]} />
          </View>
        </View>

        <View style={styles.card}>
          <Kicker style={{ marginBottom: 14 }}>DISCIPLINE</Kicker>
          <View style={styles.cardRow}>
            <Bell size={17} color={colors.accent400} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardRowLabel}>Rappel quotidien</Text>
              <Text style={styles.cardRowSub}>Chaque soir à 21:00 — le rapport se ferme à minuit.</Text>
            </View>
          </View>
        </View>

        <View style={styles.dangerCard}>
          <Kicker color={colors.danger} style={{ marginBottom: 8 }}>ZONE SENSIBLE</Kicker>
          <Text style={styles.dangerText}>
            Recommencer efface tes objectifs, ton historique et ta série. Cette action est
            irréversible.
          </Text>
          <Button
            label="RECOMMENCER UN NOUVEAU CYCLE"
            variant="secondary"
            block
            minHeight={46}
            style={{ marginTop: 14, borderColor: colors.danger }}
            textStyle={{ color: colors.danger }}
            onPress={confirmReset}
          />
        </View>

        <Button
          label="SE DÉCONNECTER"
          variant="ghost"
          block
          minHeight={44}
          style={{ marginTop: 16 }}
          textStyle={{ color: colors.textMuted45 }}
          onPress={confirmLogout}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: 22, paddingBottom: 28 },
  identity: { flexDirection: "row", gap: 16, alignItems: "flex-start", marginBottom: 24 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentSoft15,
    borderWidth: 1,
    borderColor: colors.accentBorder35,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.bodyMedium, fontSize: 22, color: colors.accent300 },
  card: {
    borderWidth: 1,
    borderColor: colors.divider14,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceCard,
    padding: 16,
    marginBottom: 12,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  cardRowLabel: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.text },
  cardRowSub: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted45, marginTop: 2 },
  daysLeft: { fontFamily: fonts.mono, fontSize: 12, color: colors.accent400 },
  cardBarTrack: { height: 3, borderRadius: 2, backgroundColor: colors.divider16, marginTop: 14, overflow: "hidden" },
  cardBarFill: { height: 3, borderRadius: 2, backgroundColor: colors.accent },
  dangerCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(224,138,138,0.3)",
    borderRadius: radius.xl,
    backgroundColor: "rgba(224,138,138,0.06)",
    padding: 16,
  },
  dangerText: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19.5, color: colors.textMuted65 },
});
