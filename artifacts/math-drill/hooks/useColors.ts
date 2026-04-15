import { useColorScheme } from "react-native";

import colors from "@/constants/colors";

/**
 * Returns the design tokens for the current color scheme.
 *
 * The returned object contains all color tokens for the active palette
 * plus scheme-independent values like `radius`.
 *
 * Falls back to the light palette when no dark key is defined in
 * constants/colors.ts (the scaffold ships light-only by default).
 * When a sibling web artifact's dark tokens are synced into a `dark`
 * key, this hook will automatically switch palettes based on the
 * device's appearance setting.
 */
export function useColors() {
  const colorScheme = useColorScheme();
  const palette =
    colorScheme === "dark" && "dark" in colors
      ? (colors as Record<string, typeof colors.light>).dark
      : colors.light;
  return {
    ...palette,
    radius: colors.radius,
    approximation: colorScheme === "dark" ? "#f59e0b" : "#d97706",
    series:         colorScheme === "dark" ? "#8b5cf6" : "#7c3aed",
    percentageCalc: colorScheme === "dark" ? "#06b6d4" : "#0891b2",
    simplification: colorScheme === "dark" ? "#ec4899" : "#db2777",
  };
}
