import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { AdBanner } from "@/components/AdBanner";
import { CountPicker } from "@/components/CountPicker";
import type { PctType } from "@/utils/examData";

interface TypeOption {
  key: PctType;
  label: string;
  example: string;
}

const PCT_TYPES: TypeOption[] = [
  { key: "find_pct_of",    label: "Find X% of Y",  example: "25% of 320 = ?" },
  { key: "what_pct_is",    label: "X is ?% of Y",  example: "80 is what % of 400?" },
  { key: "after_increase", label: "% Increase",    example: "500 after 20% increase = ?" },
  { key: "after_decrease", label: "% Decrease",    example: "600 after 15% decrease = ?" },
  { key: "mixed",          label: "Mixed",          example: "Random mix of all types" },
];

export default function PercentageSelectScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [pctType, setPctType] = useState<PctType>("mixed");
  const [count, setCount] = useState(20);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const accent = colors.percentageCalc;

  const selected = PCT_TYPES.find((t) => t.key === pctType)!;

  const startDrill = () => {
    router.push({
      pathname: "/quiz",
      params: {
        mode: "percentage",
        pctType,
        questionCount: String(count),
      },
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={[styles.iconBox, { backgroundColor: accent + "22" }]}>
            <Feather name="percent" size={28} color={accent} />
          </View>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Percentage Calc</Text>
          <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
            %, change & comparison
          </Text>
        </View>

        {/* Type picker */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TYPE</Text>
        <View style={styles.comboGrid}>
          {PCT_TYPES.map((t) => {
            const active = pctType === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => setPctType(t.key)}
                style={[
                  styles.comboChip,
                  {
                    backgroundColor: active ? accent : colors.card,
                    borderColor: active ? accent : colors.border,
                  },
                ]}
              >
                <Text style={[styles.comboLabel, { color: active ? "#fff" : colors.foreground }]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Preview */}
        <View style={[styles.preview, { backgroundColor: accent + "15", borderColor: accent + "40" }]}>
          <Text style={[styles.previewLabel, { color: accent }]}>EXAMPLE</Text>
          <Text style={[styles.previewText, { color: colors.foreground }]}>
            {selected.example}
          </Text>
        </View>

        {/* Count picker */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>QUESTIONS</Text>
        <CountPicker value={count} onChange={setCount} />

        {/* Start button */}
        <Pressable
          onPress={startDrill}
          style={({ pressed }) => [
            styles.startBtn,
            { backgroundColor: accent, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Feather name="percent" size={20} color="#fff" />
          <Text style={styles.startLabel}>
            Start {count === 0 ? "Endless" : `${count} Question`} Drill
          </Text>
        </Pressable>
      </ScrollView>

      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 16 },
  header: { alignItems: "center", gap: 6, paddingBottom: 4 },
  backBtn: { alignSelf: "flex-start", padding: 4, marginBottom: 8 },
  iconBox: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  screenTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  screenSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    letterSpacing: 2, textTransform: "uppercase", marginBottom: -4,
  },
  comboGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  comboChip: {
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 12,
    alignItems: "center",
  },
  comboLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  preview: {
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 4,
  },
  previewLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  previewText: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  startBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, borderRadius: 16, paddingVertical: 18, marginTop: 4,
  },
  startLabel: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
});
