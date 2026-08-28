import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { OnboardingScreen } from "./OnboardingScreen";
import { LoginScreen } from "./LoginScreen";

// Shown whenever there's no active session: a brand-new visitor walks the
// signup wizard (OnboardingScreen), a returning one can switch to the
// login form instead. A reset (authToken kept, onboardingComplete cleared)
// skips this entirely — OnboardingScreen detects the existing token and
// goes straight into "pick new goals" mode.
export function AuthGate() {
  const { state } = useApp();
  const [mode, setMode] = useState<"signup" | "login">("signup");

  if (state.authToken) return <OnboardingScreen />;

  return mode === "login" ? (
    <LoginScreen onRequestSignup={() => setMode("signup")} />
  ) : (
    <OnboardingScreen onRequestLogin={() => setMode("login")} />
  );
}
