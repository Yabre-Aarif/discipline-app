import React from "react";
import { StyleProp, StyleSheet, Text, TextInput, TextStyle, View, ViewStyle } from "react-native";
import { colors, fonts, radius } from "../theme/theme";

type Props = {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  minHeight?: number;
  fontSize?: number;
  textAlign?: "left" | "right" | "center";
  transparent?: boolean; // no border/background — for inline edit rows
  color?: string;
  keyboardType?: "default" | "email-address" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words";
  onBlur?: () => void;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  minHeight = 44,
  fontSize = 14,
  textAlign = "left",
  transparent,
  color,
  keyboardType = "default",
  autoCapitalize = "sentences",
  onBlur,
  style,
  inputStyle,
}: Props) {
  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted40}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        selectionColor={colors.accent}
        style={[
          styles.input,
          { minHeight, fontSize, textAlign, color: color ?? colors.text },
          transparent && styles.transparent,
          inputStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.body,
    fontSize: 12,
    marginBottom: 5,
    color: colors.textMuted70,
  },
  input: {
    width: "100%",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontFamily: fonts.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider16,
    borderRadius: radius.md,
  },
  transparent: {
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
});
