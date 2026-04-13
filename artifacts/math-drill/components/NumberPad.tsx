import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

interface NumberPadProps {
  onPress: (digit: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const ROWS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["0", "DEL", "OK"],
];

export function NumberPad({
  onPress,
  onDelete,
  onSubmit,
  disabled,
}: NumberPadProps) {
  const colors = useColors();

  const handlePress = (key: string) => {
    if (disabled) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (key === "DEL") {
      onDelete();
    } else if (key === "OK") {
      onSubmit();
    } else {
      onPress(key);
    }
  };

  return (
    <View style={styles.container}>
      {ROWS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((key) => {
            const isOK = key === "OK";
            const isDEL = key === "DEL";
            const bg = isOK
              ? colors.primary
              : isDEL
                ? colors.destructive
                : colors.card;
            const fg = isOK || isDEL ? "#ffffff" : colors.foreground;

            return (
              <Pressable
                key={key}
                onPress={() => handlePress(key)}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.key,
                  { backgroundColor: bg, opacity: pressed ? 0.7 : 1, borderColor: colors.border },
                ]}
              >
                {isDEL ? (
                  <Feather name="delete" size={22} color={fg} />
                ) : (
                  <Text style={[styles.keyText, { color: fg }]}>{key}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  key: {
    flex: 1,
    height: 64,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  keyText: {
    fontSize: 26,
    fontFamily: "Inter_600SemiBold",
  },
});
