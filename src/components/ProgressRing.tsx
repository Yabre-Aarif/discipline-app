import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors, fonts } from "../theme/theme";

const CIRCUMFERENCE = 157;

export function ProgressRing({ pct, size = 54, label }: { pct: number; size?: number; label: string }) {
  const offset = CIRCUMFERENCE - (CIRCUMFERENCE * Math.max(0, Math.min(100, pct))) / 100;
  return (
    <View style={{ width: size, height: size }}>
      <Svg viewBox="0 0 56 56" width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={28} cy={28} r={25} fill="none" stroke={colors.divider14} strokeWidth={3} />
        <Circle
          cx={28}
          cy={28}
          r={25}
          fill="none"
          stroke={colors.accent}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE}`}
          strokeDashoffset={offset}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.center}>
          <Text style={styles.label}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
});
