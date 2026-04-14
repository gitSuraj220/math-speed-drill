import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

interface NumberPadProps {
  onPress: (digit: string) => void;
  onDelete: () => void;
  onClear: () => void;
  onCancel: () => void;
  disabled?: boolean;
  showDecimal?: boolean;
}

const DIGIT_ROWS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
];

export function NumberPad({
  onPress,
  onDelete,
  onClear,
  onCancel,
  disabled,
  showDecimal = false,
}: NumberPadProps) {
  const colors = useColors();

  const tap = (fn: () => void, style: "light" | "medium" | "heavy" = "light") => {
    if (disabled) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(
        style === "heavy"
          ? Haptics.ImpactFeedbackStyle.Heavy
          : style === "medium"
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      );
    }
    fn();
  };

  return (
    <View style={styles.container}>
      {DIGIT_ROWS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((digit) => (
            <Pressable
              key={digit}
              onPress={() => tap(() => onPress(digit))}
              disabled={disabled}
              style={({ pressed }) => [
                styles.digitKey,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.65 : 1,
                },
              ]}
            >
              <Text style={[styles.digitText, { color: colors.foreground }]}>
                {digit}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}

      {showDecimal ? (
        <View style={styles.row}>
          <Pressable
            onPress={() => tap(() => onPress("."))}
            disabled={disabled}
            style={({ pressed }) => [
              styles.digitKey,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.65 : 1,
              },
            ]}
          >
            <Text style={[styles.digitText, { color: colors.foreground }]}>.</Text>
          </Pressable>
          <Pressable
            onPress={() => tap(() => onPress("0"))}
            disabled={disabled}
            style={({ pressed }) => [
              styles.digitKey,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.65 : 1,
              },
            ]}
          >
            <Text style={[styles.digitText, { color: colors.foreground }]}>0</Text>
          </Pressable>
          <Pressable
            onPress={() => tap(onDelete)}
            disabled={disabled}
            style={({ pressed }) => [
              styles.digitKey,
              {
                backgroundColor: colors.muted,
                borderColor: colors.border,
                opacity: pressed ? 0.65 : 1,
              },
            ]}
          >
            <Feather name="delete" size={22} color={colors.mutedForeground} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => tap(() => onPress("0"))}
          disabled={disabled}
          style={({ pressed }) => [
            styles.zeroKey,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.65 : 1,
            },
          ]}
        >
          <Text style={[styles.digitText, { color: colors.foreground }]}>0</Text>
        </Pressable>
      )}

      <View style={styles.row}>
        <Pressable
          onPress={() => tap(onClear, "medium")}
          disabled={disabled}
          style={({ pressed }) => [
            styles.actionKey,
            {
              backgroundColor: "#78350f22",
              borderColor: "#92400e55",
              opacity: pressed ? 0.65 : 1,
            },
          ]}
        >
          <Feather name="x-circle" size={18} color="#fbbf24" />
          <Text style={[styles.actionText, { color: "#fbbf24" }]}>CLR</Text>
        </Pressable>

        {!showDecimal && (
          <Pressable
            onPress={() => tap(onDelete)}
            disabled={disabled}
            style={({ pressed }) => [
              styles.actionKey,
              {
                backgroundColor: colors.muted,
                borderColor: colors.border,
                opacity: pressed ? 0.65 : 1,
              },
            ]}
          >
            <Feather name="delete" size={18} color={colors.mutedForeground} />
            <Text style={[styles.actionText, { color: colors.mutedForeground }]}>
              ⌫
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => tap(onCancel, "heavy")}
          style={({ pressed }) => [
            styles.actionKey,
            {
              backgroundColor: "#7f1d1d22",
              borderColor: "#ef444455",
              opacity: pressed ? 0.65 : 1,
            },
          ]}
        >
          <Feather name="log-out" size={18} color="#ef4444" />
          <Text style={[styles.actionText, { color: "#ef4444" }]}>Exit</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  digitKey: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  zeroKey: {
    height: 60,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  actionKey: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    flexDirection: "row",
  },
  digitText: {
    fontSize: 26,
    fontFamily: "Inter_600SemiBold",
  },
  actionText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
});
