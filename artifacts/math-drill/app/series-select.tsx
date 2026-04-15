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

const PATTERN_TYPES = [
  { label: "Arithmetic",              example: "+d",  desc: "Each term increases by a fixed difference" },
  { label: "Geometric",               example: "×r",  desc: "Each term is multiplied by a fixed ratio" },
  { label: "Squares",                 example: "n²",  desc: "Terms are perfect squares: 1, 4, 9, 16..." },
  { label: "Cubes",                   example: "n³",  desc: "Terms are perfect cubes: 1, 8, 27, 64..." },
  { label: "Difference Series",       example: "Δ+d", desc: "Differences form an arithmetic sequence" },
  { label: "Alternating Differences", example: "±d",  desc: "Two alternating differences: +d1, +d2, +d1..." },
];

export default function SeriesSelectScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [count, setCount] = useState(20);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const accent = colors.series;

  const startDrill = () => {
    router.push({
      pathname: "/quiz",
      params: {
        mode: "series",
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
            <Feather name="trending-up" size={28} color={accent} />
          </View>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Number Series</Text>
          <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
            Find the next term
          </Text>
        </View>

        {/* Pattern info card */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PATTERN TYPES</Text>
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.infoCardTitle, { color: colors.foreground }]}>
            All patterns are randomised — every drill is unique
          </Text>
          {PATTERN_TYPES.map((p) => (
            <View key={p.label} style={styles.patternRow}>
              <View style={[styles.patternBadge, { backgroundColor: accent + "22" }]}>
                <Text style={[styles.patternExample, { color: accent }]}>{p.example}</Text>
              </View>
              <View style={styles.patternInfo}>
                <Text style={[styles.patternLabel, { color: colors.foreground }]}>{p.label}</Text>
                <Text style={[styles.patternDesc, { color: colors.mutedForeground }]}>{p.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Preview */}
        <View style={[styles.preview, { backgroundColor: accent + "15", borderColor: accent + "40" }]}>
          <Text style={[styles.previewLabel, { color: accent }]}>EXAMPLE</Text>
          <Text style={[styles.previewText, { color: colors.foreground }]}>3, 7, 13, 21, 31, ?</Text>
          <Text style={[styles.previewHint, { color: colors.mutedForeground }]}>
            Differences: +4, +6, +8, +10... → answer is 43
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
          <Feather name="trending-up" size={20} color="#fff" />
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
  infoCard: {
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 12,
  },
  infoCardTitle: {
    fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 2,
  },
  patternRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  patternBadge: {
    width: 44, height: 36, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  patternExample: { fontSize: 13, fontFamily: "Inter_700Bold" },
  patternInfo: { flex: 1 },
  patternLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  patternDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
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
