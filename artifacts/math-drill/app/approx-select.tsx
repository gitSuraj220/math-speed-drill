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

type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTIES: { key: Difficulty; label: string; desc: string }[] = [
  { key: "easy",   label: "Easy",   desc: "a × b ≈ ? (2 numbers)" },
  { key: "medium", label: "Medium", desc: "X% of Y ≈ ?" },
  { key: "hard",   label: "Hard",   desc: "(a×b)÷c ≈ ?" },
];

const EXAMPLES: Record<Difficulty, string> = {
  easy:   "19.7 × 49.3 ≈ ?",
  medium: "24.8% of 398 ≈ ?",
  hard:   "(312 × 4.9) ÷ 19.7 ≈ ?",
};

export default function ApproxSelectScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [count, setCount] = useState(20);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const accent = colors.approximation;

  const startDrill = () => {
    router.push({
      pathname: "/quiz",
      params: {
        mode: "approximation",
        difficulty,
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
            <Feather name="zap" size={28} color={accent} />
          </View>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Approximation Drill</Text>
          <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
            Round &amp; estimate fast
          </Text>
        </View>

        {/* Difficulty picker */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DIFFICULTY</Text>
        <View style={styles.opRow}>
          {DIFFICULTIES.map((d) => {
            const active = difficulty === d.key;
            return (
              <Pressable
                key={d.key}
                onPress={() => setDifficulty(d.key)}
                style={[
                  styles.opCard,
                  { backgroundColor: colors.card, borderColor: active ? accent : colors.border, borderWidth: active ? 2 : 1 },
                ]}
              >
                <View style={[styles.opIcon, { backgroundColor: active ? accent + "22" : colors.muted + "22" }]}>
                  <Feather
                    name={d.key === "easy" ? "smile" : d.key === "medium" ? "target" : "trending-up"}
                    size={20}
                    color={active ? accent : colors.mutedForeground}
                  />
                </View>
                <Text style={[styles.opLabel, { color: active ? accent : colors.foreground }]}>{d.label}</Text>
                <Text style={[styles.opDesc, { color: colors.mutedForeground }]}>{d.desc}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Preview */}
        <View style={[styles.preview, { backgroundColor: accent + "15", borderColor: accent + "40" }]}>
          <Text style={[styles.previewLabel, { color: accent }]}>EXAMPLE</Text>
          <Text style={[styles.previewText, { color: colors.foreground }]}>
            {EXAMPLES[difficulty]}
          </Text>
          <Text style={[styles.previewHint, { color: colors.mutedForeground }]}>
            Round the messy numbers, then calculate
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
          <Feather name="zap" size={20} color="#fff" />
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
  opRow: { flexDirection: "row", gap: 10 },
  opCard: {
    flex: 1, borderRadius: 14, padding: 12, gap: 6, alignItems: "center",
  },
  opIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  opLabel: { fontSize: 13, fontFamily: "Inter_700Bold" },
  opDesc: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  preview: {
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 4,
  },
  previewLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  previewText: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  previewHint: { fontSize: 12, fontFamily: "Inter_400Regular" },
  startBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, borderRadius: 16, paddingVertical: 18, marginTop: 4,
  },
  startLabel: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
});
