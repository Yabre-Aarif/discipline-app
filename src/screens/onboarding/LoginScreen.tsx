import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSyncActions } from "../../context/syncActions";
import { ApiError } from "../../api/client";
import { colors, fonts } from "../../theme/theme";
import { Button } from "../../components/Button";
import { TextField } from "../../components/TextField";
import { Kicker } from "../../components/Kicker";

export function LoginScreen({ onRequestSignup }: { onRequestSignup: () => void }) {
  const sync = useSyncActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = email.trim() && password.trim();

  async function submit() {
    setError("");
    setSubmitting(true);
    try {
      await sync.login(email.trim().toLowerCase(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue. Réessaie.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Kicker color={colors.accent} style={{ marginBottom: 14 }}>
            RECONNEXION
          </Kicker>
          <Text style={styles.h1}>Content de{"\n"}te revoir.</Text>
          <Text style={styles.intro}>Ton cycle, tes objectifs et ton historique t'attendent.</Text>

          <View style={{ gap: 14 }}>
            <TextField
              label="Adresse e-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="toi@mail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              minHeight={44}
            />
            <TextField label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry minHeight={44} />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={{ flex: 1, minHeight: 24 }} />
          <Button
            label={submitting ? "…" : "SE CONNECTER"}
            block
            minHeight={48}
            disabled={!canSubmit || submitting}
            loading={submitting}
            onPress={submit}
          />
          <Button
            label="Pas encore de compte — Créer un compte"
            variant="ghost"
            block
            minHeight={38}
            textStyle={{ color: colors.textMuted45 }}
            onPress={onRequestSignup}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 22 },
  h1: { fontFamily: fonts.bodyMedium, fontSize: 38, lineHeight: 42, letterSpacing: -0.8, color: colors.text, marginBottom: 10 },
  intro: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 22, color: colors.textMuted55, marginBottom: 26, maxWidth: 290 },
  errorText: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: colors.danger, marginTop: 16 },
});
