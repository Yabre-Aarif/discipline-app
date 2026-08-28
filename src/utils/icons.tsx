import React from "react";
import type { IconProps } from "phosphor-react-native";
import {
  HandsPraying,
  Barbell,
  BookOpen,
  Briefcase,
  Moon,
  Drop,
  DeviceMobileSlash,
  Brain,
  Wallet,
  ForkKnife,
  Translate,
  ThermometerCold,
  Target,
} from "phosphor-react-native";

// Ported 1:1 from the design's ICONS regex table (Discipline.dc.html).
const ICON_RULES: [RegExp, React.ComponentType<IconProps>][] = [
  [/pri[eè]re|salat|coran|spirit/i, HandsPraying],
  [/sport|muscu|course|courir|gym|pompes|marche/i, Barbell],
  [/lir|lect|livre|page/i, BookOpen],
  [/[eé]tud|travail|focus|r[eé]vis|cours|projet/i, Briefcase],
  [/sommeil|dormir|coucher|r[eé]veil/i, Moon],
  [/eau|boire|litre/i, Drop],
  [/[eé]cran|t[eé]l[eé]phone|r[eé]seaux|instagram/i, DeviceMobileSlash],
  [/m[eé]dit|respir|calme/i, Brain],
  [/argent|d[eé]pens|budget|[eé]pargn/i, Wallet],
  [/poids|kg|maigrir|je[uû]ne|jeun|manger|sucre/i, ForkKnife],
  [/anglais|langue|mot|vocab/i, Translate],
  [/froid|douche/i, ThermometerCold],
];

export function iconFor(label: string): React.ComponentType<IconProps> {
  const rule = ICON_RULES.find(([re]) => re.test(label));
  return rule ? rule[1] : Target;
}
