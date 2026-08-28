import { Platform } from "react-native";

// Ported from _ds/nocturne-.../styles.css — the Nocturne design-system tokens
// used by the Discipline design source.
export const colors = {
  bg: "#161826",
  bgWall: "#12131d",
  bgTabBar: "#12131f",
  bgTabBarWall: "#0d0e17",
  bezel: "#07080f",
  surface: "#232532",
  surfaceRow: "#1c1e2b",
  surfaceCard: "#1a1c29",
  text: "#e9e9ed",
  textMuted85: "rgba(233,233,237,0.85)",
  textMuted80: "rgba(233,233,237,0.8)",
  textMuted75: "rgba(233,233,237,0.75)",
  textMuted70: "rgba(233,233,237,0.7)",
  textMuted65: "rgba(233,233,237,0.65)",
  textMuted60: "rgba(233,233,237,0.6)",
  textMuted55: "rgba(233,233,237,0.55)",
  textMuted50: "rgba(233,233,237,0.5)",
  textMuted45: "rgba(233,233,237,0.45)",
  textMuted40: "rgba(233,233,237,0.4)",
  textMuted35: "rgba(233,233,237,0.35)",
  textMuted30: "rgba(233,233,237,0.3)",
  divider10: "rgba(233,233,237,0.1)",
  divider12: "rgba(233,233,237,0.12)",
  divider14: "rgba(233,233,237,0.14)",
  divider16: "rgba(233,233,237,0.16)",
  divider22: "rgba(233,233,237,0.22)",
  accent: "#9184d9",
  accent2: "#a7a1db",
  accent100: "#f5f4ff",
  accent200: "#e7e5fe",
  accent300: "#d2cefd",
  accent400: "#b5abfc",
  accent500: "#968ae0",
  accent600: "#796cbf",
  accent700: "#5d5294",
  accent800: "#423a6a",
  accentSoft15: "rgba(145,132,217,0.15)",
  accentSoft20: "rgba(145,132,217,0.2)",
  accentSoft07: "rgba(145,132,217,0.07)",
  accentBorder35: "rgba(145,132,217,0.35)",
  section: "#262a60",
  sectionGlow: "#1b1d3a",
  danger: "#e08a8a",
} as const;

export const fonts = {
  body: Platform.select({ ios: "Inter", android: "Inter", default: "Inter" }),
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  mono: Platform.select({ ios: "Courier", android: "monospace", default: "monospace" }),
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 10,
  xl: 14,
};

export const space = {
  1: 3,
  2: 6,
  3: 8,
  4: 11,
  6: 17,
  8: 22,
};
