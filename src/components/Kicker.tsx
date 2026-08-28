import React from "react";
import { StyleProp, Text, TextStyle } from "react-native";
import { colors, fonts } from "../theme/theme";

export function Kicker({
  children,
  color = colors.textMuted45,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      style={[
        { fontFamily: fonts.mono, fontWeight: "600", fontSize: 10, letterSpacing: 1.6, color },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
