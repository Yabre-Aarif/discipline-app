import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { useApp } from "../context/AppContext";
import { AuthGate } from "../screens/onboarding/AuthGate";
import { MainTabs } from "./MainTabs";
import { colors } from "../theme/theme";

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, border: colors.divider12 },
};

export function RootNavigator() {
  const { state } = useApp();

  if (!state.hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {state.onboardingComplete ? <MainTabs /> : <AuthGate />}
    </NavigationContainer>
  );
}
