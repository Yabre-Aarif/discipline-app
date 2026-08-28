import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, Plus, SealCheck, X } from "phosphor-react-native";
import { useApp } from "../../context/AppContext";
import { useSyncActions } from "../../context/syncActions";
import { ApiError } from "../../api/client";
import { colors, fonts, radius } from "../../theme/theme";
import { Button } from "../../components/Button";
import { TextField } from "../../components/TextField";
import { Kicker } from "../../components/Kicker";
import { iconFor } from "../../utils/icons";
import { addDays, formatFrenchDate, formatFrenchDateRange } from "../../utils/date";

const DAILY_SUGGESTIONS = [
  "Prière du Fajr",
  "Sport 45 min",
  "20 pages de lecture",
  "2 L d'eau",
  "Coucher avant 23:00",
  "Moins de 2 h d'écran",
];

const TOTAL_STEPS = 4;

export function OnboardingScreen({ onRequestLogin }: { onRequestLogin?: () => void }) {
  const { state, dispatch } = useApp();
  const sync = useSyncActions();
  // Reset flow for an already-authenticated user: identity is known, skip
  // straight to picking new goals.
  const isReauth = !!state.authToken;
  const [step, setStep] = useState(isReauth ? 2 : 1);
  const [name, setName] = useState(state.user.name);
  const [email, setEmail] = useState(state.user.email);
  const [password, setPassword] = useState("");
  const [draftDaily, setDraftDaily] = useState("");
  const [draftDailyTarget, setDraftDailyTarget] = useState("");
  const [draftGoal, setDraftGoal] = useState("");
  const [draftGoalTarget, setDraftGoalTarget] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sworn, setSworn] = useState(false);

  const cycleRange = useMemo(() => {
    const start = new Date();
    return formatFrenchDateRange(start, addDays(start, 99));
  }, []);

  const dailyCount = state.dailies.length;
  const goalCount = state.goals.length;

  const canContinueStep1 = name.trim() && email.trim() && password.trim().length >= 6;
  const canContinueStep2 = dailyCount >= 1;
  const canContinueStep3 = goalCount >= 1;
  const canStart = sworn;

  async function finish() {
    setError("");
    setSubmitting(true);
    try {
      if (isReauth) {
        await sync.startCycle();
      } else {
        await sync.signup(name.trim(), email.trim().toLowerCase(), password);
      }
      setStep(5);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue. Réessaie.");
    } finally {
      setSubmitting(false);
    }
  }

  function addDaily(label: string) {
    const l = label.trim();
    if (!l) return;
    dispatch({ type: "ADD_DAILY", label: l, target: draftDailyTarget });
    setDraftDaily("");
    setDraftDailyTarget("");
  }

  function addGoal() {
    const l = draftGoal.trim();
    if (!l) return;
    dispatch({ type: "ADD_GOAL", label: l, target: draftGoalTarget });
    setDraftGoal("");
    setDraftGoalTarget("");
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={12}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step <= TOTAL_STEPS ? (
            <View style={styles.progressRow}>
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressSeg,
                    i < step ? styles.progressSegFilled : styles.progressSegEmpty,
                  ]}
                />
              ))}
            </View>
          ) : null}

          {step === 1 && !isReauth && (
            <View>
              <Kicker color={colors.accent} style={{ marginBottom: 14 }}>
                ÉTAPE 01 / IDENTITÉ
              </Kicker>
              <Text style={styles.h1}>100 jours.{"\n"}Aucune excuse.</Text>
              <Text style={styles.intro}>
                Tu fixes tes objectifs. L'app ne fait que compter ce que tu as tenu.
              </Text>
              <View style={{ gap: 14 }}>
                <TextField label="Nom" value={name} onChangeText={setName} placeholder="Ton nom" minHeight={44} />
                <TextField
                  label="Adresse e-mail"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="toi@mail.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  minHeight={44}
                />
                <TextField
                  label="Mot de passe"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="6 caractères minimum"
                  secureTextEntry
                  minHeight={44}
                />
                <View>
                  <Text style={styles.fieldLabel}>Début du cycle</Text>
                  <View style={styles.staticField}>
                    <Text style={styles.staticFieldText}>{cycleRange}</Text>
                  </View>
                </View>
              </View>
              <View style={{ flex: 1, minHeight: 20 }} />
              <Button
                label="CONTINUER"
                block
                minHeight={48}
                disabled={!canContinueStep1}
                onPress={() => setStep(2)}
              />
              {onRequestLogin && (
                <Button
                  label="J'ai déjà un compte — Se connecter"
                  variant="ghost"
                  block
                  minHeight={38}
                  textStyle={{ color: colors.textMuted45 }}
                  onPress={onRequestLogin}
                />
              )}
            </View>
          )}

          {step === 2 && (
            <View>
              <Kicker color={colors.accent} style={{ marginBottom: 12 }}>
                ÉTAPE 02 / OBJECTIFS QUOTIDIENS
              </Kicker>
              <Text style={styles.h2}>Écris ce que tu{"\n"}feras chaque jour.</Text>
              <Text style={styles.introSmall}>
                Un objectif = une action cochable le soir. Sois précis : « 20 pages », pas « lire ».
              </Text>

              <View style={{ gap: 8 }}>
                {state.dailies.map((d) => {
                  const Icon = iconFor(d.label);
                  return (
                    <View key={d.id} style={styles.row}>
                      <Icon size={17} color={colors.accent400} />
                      <TextField
                        value={d.label}
                        onChangeText={(v) => dispatch({ type: "RENAME_DAILY", id: d.id, label: v })}
                        transparent
                        minHeight={26}
                        fontSize={14}
                        style={{ flex: 1 }}
                      />
                      <TextField
                        value={d.target}
                        onChangeText={(v) => dispatch({ type: "RETARGET_DAILY", id: d.id, target: v })}
                        transparent
                        minHeight={26}
                        fontSize={12}
                        textAlign="right"
                        color={colors.textMuted50}
                        style={{ width: 90 }}
                      />
                      <Pressable onPress={() => dispatch({ type: "REMOVE_DAILY", id: d.id })} hitSlop={8}>
                        <X size={14} color={colors.textMuted40} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>

              <View style={styles.addRow}>
                <TextField
                  value={draftDaily}
                  onChangeText={setDraftDaily}
                  onSubmitEditing={() => addDaily(draftDaily)}
                  placeholder="Nouvel objectif quotidien…"
                  minHeight={44}
                  style={{ flex: 1 }}
                />
                <Button variant="primary" minHeight={44} style={styles.addBtn} onPress={() => addDaily(draftDaily)}>
                  <Plus size={16} color={colors.accent} />
                </Button>
              </View>

              <View style={styles.chipRow}>
                {DAILY_SUGGESTIONS.filter((s) => !state.dailies.some((d) => d.label === s))
                  .slice(0, 5)
                  .map((s) => (
                    <Button
                      key={s}
                      variant="secondary"
                      minHeight={34}
                      fontSize={11.5}
                      style={styles.chip}
                      textStyle={{ color: colors.textMuted65 }}
                      label={`+ ${s}`}
                      onPress={() => addDaily(s)}
                    />
                  ))}
              </View>

              <View style={{ flex: 1, minHeight: 18 }} />
              <Kicker style={{ marginBottom: 10 }}>
                {dailyCount} OBJECTIFS · VERROUILLÉS 100 JOURS
              </Kicker>
              <Button
                label="SUIVANT : OBJECTIFS 100 JOURS"
                block
                minHeight={48}
                disabled={!canContinueStep2}
                onPress={() => setStep(3)}
              />
              {!isReauth && (
                <Button
                  label="Retour"
                  variant="ghost"
                  block
                  minHeight={38}
                  textStyle={{ color: colors.textMuted45 }}
                  onPress={() => setStep(1)}
                />
              )}
            </View>
          )}

          {step === 3 && (
            <View>
              <Kicker color={colors.accent} style={{ marginBottom: 12 }}>
                ÉTAPE 03 / OBJECTIFS 100 JOURS
              </Kicker>
              <Text style={styles.h2}>Où seras-tu{"\n"}le 100ᵉ jour ?</Text>
              <Text style={styles.introSmall}>
                Une cible chiffrée par objectif. Elle avance avec tes journées tenues.
              </Text>

              <View style={{ gap: 10 }}>
                {state.goals.map((g) => {
                  const Icon = iconFor(g.label);
                  return (
                    <View key={g.id} style={styles.goalCard}>
                      <View style={styles.rowTop}>
                        <Icon size={17} color={colors.accent400} />
                        <TextField
                          value={g.label}
                          onChangeText={(v) => dispatch({ type: "RENAME_GOAL", id: g.id, label: v })}
                          transparent
                          minHeight={26}
                          fontSize={14}
                          style={{ flex: 1 }}
                        />
                        <Pressable onPress={() => dispatch({ type: "REMOVE_GOAL", id: g.id })} hitSlop={8}>
                          <X size={14} color={colors.textMuted40} />
                        </Pressable>
                      </View>
                      <View style={styles.rowTarget}>
                        <Text style={styles.targetLabel}>Cible</Text>
                        <TextField
                          value={g.target}
                          onChangeText={(v) => dispatch({ type: "RETARGET_GOAL", id: g.id, target: v })}
                          minHeight={32}
                          fontSize={12.5}
                          style={{ flex: 1 }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={styles.addRow}>
                <TextField
                  value={draftGoal}
                  onChangeText={setDraftGoal}
                  onSubmitEditing={addGoal}
                  placeholder="Nouvel objectif 100 jours…"
                  minHeight={44}
                  style={{ flex: 1 }}
                />
                <Button variant="primary" minHeight={44} style={styles.addBtn} onPress={addGoal}>
                  <Plus size={16} color={colors.accent} />
                </Button>
              </View>

              <View style={{ flex: 1, minHeight: 18 }} />
              <Button
                label="SUIVANT : SERMENT"
                block
                minHeight={48}
                disabled={!canContinueStep3}
                onPress={() => setStep(4)}
              />
              <Button
                label="Retour"
                variant="ghost"
                block
                minHeight={38}
                textStyle={{ color: colors.textMuted45 }}
                onPress={() => setStep(2)}
              />
            </View>
          )}

          {step === 4 && (
            <View>
              <Kicker color={colors.accent} style={{ marginBottom: 14 }}>
                ÉTAPE 04 / SERMENT
              </Kicker>
              <View style={styles.oathCard}>
                <SealCheck size={28} color={colors.accent} />
                <Text style={styles.oathText}>
                  « {dailyCount} objectif{dailyCount > 1 ? "s" : ""} quotidien
                  {dailyCount > 1 ? "s" : ""}, {goalCount} objectif{goalCount > 1 ? "s" : ""} à 100
                  jours. Je ne les changerai pas avant le jour 100. »
                </Text>
                <Text style={styles.oathSub}>
                  Le rapport se ferme à minuit. Un objectif non coché est manqué et reste inscrit dans
                  le cycle.
                </Text>
              </View>
              <Pressable style={styles.swearRow} onPress={() => setSworn((s) => !s)}>
                <View style={styles.checkbox}>
                  {sworn ? (
                    <View style={styles.checkboxFill}>
                      <Check size={14} color={colors.accent300} />
                    </View>
                  ) : null}
                </View>
                <Text style={styles.swearText}>
                  J'accepte le rappel quotidien à 21:00 et le verrouillage de mes objectifs pendant 100
                  jours.
                </Text>
              </Pressable>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <View style={{ flex: 1, minHeight: 18 }} />
              <Button
                label={submitting ? "…" : "DÉMARRER LE CYCLE"}
                block
                minHeight={48}
                disabled={!canStart || submitting}
                loading={submitting}
                onPress={finish}
              />
              {!isReauth && (
                <Button
                  label="Retour"
                  variant="ghost"
                  block
                  minHeight={38}
                  textStyle={{ color: colors.textMuted45 }}
                  onPress={() => setStep(3)}
                />
              )}
            </View>
          )}

          {step === 5 && (
            <View style={styles.step5}>
              <Kicker color={colors.accent} style={{ marginBottom: 16, letterSpacing: 2 }}>
                JOUR 001 / 100
              </Kicker>
              <Text style={styles.h1}>Le cycle est{"\n"}ouvert.</Text>
              <Text style={styles.step5Sub}>
                {dailyCount} objectifs quotidiens à cocher ce soir. {goalCount} cibles à atteindre avant
                le {formatFrenchDate(addDays(new Date(), 99))}.
              </Text>
              <Button
                label="OUVRIR LE RAPPORT"
                minHeight={48}
                style={{ paddingHorizontal: 22 }}
                onPress={() => dispatch({ type: "FINISH_ONBOARDING" })}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 22 },
  progressRow: { flexDirection: "row", gap: 6, marginBottom: 26 },
  progressSeg: { height: 2, flex: 1 },
  progressSegFilled: { backgroundColor: colors.accent },
  progressSegEmpty: { backgroundColor: colors.divider16 },
  h1: { fontFamily: fonts.bodyMedium, fontSize: 36, lineHeight: 40, letterSpacing: -0.8, color: colors.text, marginBottom: 10 },
  h2: { fontFamily: fonts.bodyMedium, fontSize: 27, lineHeight: 31, letterSpacing: -0.5, color: colors.text, marginBottom: 8 },
  intro: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 21, color: colors.textMuted55, marginBottom: 26, maxWidth: 290 },
  introSmall: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 20, color: colors.textMuted55, marginBottom: 18 },
  fieldLabel: { fontFamily: fonts.body, fontSize: 12, marginBottom: 5, color: colors.textMuted70 },
  staticField: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider16,
    borderRadius: radius.md,
  },
  staticFieldText: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted75 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: colors.divider14,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceRow,
  },
  goalCard: {
    borderWidth: 1,
    borderColor: colors.divider14,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceRow,
    padding: 11,
    gap: 8,
  },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowTarget: { flexDirection: "row", alignItems: "center", gap: 8 },
  targetLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted45 },
  addRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  addBtn: { flex: undefined, paddingHorizontal: 14 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  chip: { paddingHorizontal: 10 },
  oathCard: {
    borderWidth: 1,
    borderColor: colors.divider16,
    borderRadius: 14,
    padding: 20,
    backgroundColor: colors.surface,
  },
  oathText: { fontFamily: fonts.bodyMedium, fontSize: 20, lineHeight: 27, letterSpacing: -0.2, color: colors.text, marginTop: 14, marginBottom: 12 },
  oathSub: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 21, color: colors.textMuted55 },
  swearRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginTop: 20 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxFill: {
    ...StyleSheet.absoluteFill,
    borderRadius: 4,
    backgroundColor: colors.accentSoft20,
    alignItems: "center",
    justifyContent: "center",
  },
  swearText: { flex: 1, fontFamily: fonts.body, fontSize: 13, lineHeight: 19.5, color: colors.textMuted75 },
  errorText: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.danger, marginTop: 14 },
  step5: { flex: 1, justifyContent: "center", alignItems: "flex-start", paddingVertical: 40 },
  step5Sub: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 21, color: colors.textMuted55, maxWidth: 285, marginBottom: 24 },
});
