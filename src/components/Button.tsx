import React from "react";
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from "react-native";
import { colors, fonts, radius, space } from "../theme/theme";

type Variant = "primary" | "secondary" | "ghost";

type Props = {
  label?: string;
  onPress?: () => void;
  variant?: Variant;
  block?: boolean;
  disabled?: boolean;
  loading?: boolean;
  dashed?: boolean;
  minHeight?: number;
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  block,
  disabled,
  loading,
  dashed,
  minHeight = 44,
  fontSize = 14,
  style,
  textStyle,
  children,
}: Props) {
  const variantStyle = variant === "primary" ? styles.primary : variant === "secondary" ? styles.secondary : styles.ghost;
  const variantTextColor = variant === "secondary" ? colors.textMuted65 : colors.accent;

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        dashed && styles.dashed,
        { minHeight },
        block && styles.block,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.accent} size="small" />
      ) : children ? (
        children
      ) : (
        <Text style={[styles.label, { color: variantTextColor, fontSize }, textStyle]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: space[3] * 1.2,
    paddingVertical: space[2],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  primary: { borderColor: colors.accent },
  secondary: { borderColor: colors.divider16 },
  ghost: { borderColor: "transparent", paddingHorizontal: space[1] },
  dashed: { borderStyle: "dashed" },
  block: { width: "100%" },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.45 },
  label: {
    fontFamily: fonts.bodyMedium,
    letterSpacing: 0,
  },
});
