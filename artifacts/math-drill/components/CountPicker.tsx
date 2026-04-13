import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

const COUNT_OPTIONS = [10, 15, 20, 25, 30, 40, 50, 0];

interface CountPickerProps {
  value: number;
  onChange: (v: number) => void;
  accentColor: string;
}

export function CountPicker({ value, onChange, accentColor }: CountPickerProps) {
  const colors = useColors();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {COUNT_OPTIONS.map((n) => {
        const isInfinity = n === 0;
        const active = n === value;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: active ? accentColor : colors.card,
                borderColor: active ? accentColor : colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            {isInfinity ? (
              <Feather
                name="infinity"
                size={18}
                color={active ? "#fff" : colors.foreground}
              />
            ) : (
              <Text
                style={[
                  styles.chipText,
                  { color: active ? "#fff" : colors.foreground },
                ]}
              >
                {n}
              </Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    minWidth: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
