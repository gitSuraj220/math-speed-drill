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

type FractionMode = "frac_to_pct" | "pct_to_frac" | "mixed";

const MODES: { key: FractionMode; label: string; icon: keyof typeof Feather.glyphMap; desc: string }[] = [
  { key: "frac_to_pct", label: "Fraction → %", icon: "arrow-right", desc: "Type the percentage for a given fraction" },
  { key: "pct_to_frac", label: "% → Fraction", icon: "arrow-left", desc: "Find the numerator for a given %" },
  { key: "mixed", label: "Mixed", icon: "shuffle", desc: "Both directions, randomly mixed" },
];

export default function FractionSelectScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [fractionMode, setFractionMode] = useState<FractionMode>("frac_to_pct");
  const [count, setCount] = useState(20);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const accent = colors.fractionPct;

  const startDrill = () => {
    router.push({
      pathname: "/quiz",
      params: {
        mode: "fraction",
        fractionMode,
        questionCount: String(count),
      },
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={[styles.iconWrap, { backgroundColor: accent + "25" }]}>
            <Feather name="percent" size={28} color={accent} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Fraction % Drill</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Fractions ↔ Percentages · D/N table 1–16
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          DRILL DIRECTION
        </Text>

        {MODES.map((m) => {
          const active = fractionMode === m.key;
          return (
            <Pressable
              key={m.key}
              onPress={() => setFractionMode(m.key)}
              style={({ pressed }) => [
                styles.modeCard,
                {
                  backgroundColor: active ? accent + "18" : colors.card,
                  borderColor: active ? accent : colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <View style={[styles.modeIconWrap, { backgroundColor: active ? accent : colors.muted }]}>
                <Feather name={m.icon} size={18} color={active ? "#fff" : colors.mutedForeground} />
              </View>
              <View style={styles.modeTextWrap}>
                <Text style={[styles.modeLabel, { color: active ? accent : colors.foreground }]}>
                  {m.label}
                </Text>
                <Text style={[styles.modeDesc, { color: colors.mutedForeground }]}>{m.desc}</Text>
              </View>
              {active && <Feather name="check-circle" size={20} color={accent} />}
            </Pressable>
          );
        })}

        <View style={[styles.infoCard, { backgroundColor: accent + "10", borderColor: accent + "40" }]}>
          <Feather name="info" size={15} color={accent} />
          <Text style={[styles.infoText, { color: accent + "cc" }]}>
            {fractionMode === "frac_to_pct"
              ? "You'll see a fraction like 3/7 and type its %  (e.g. 42.85). Decimal pad enabled."
              : fractionMode === "pct_to_frac"
              ? "You'll see ?/7 = 42.85% and type the numerator. Integer answers only."
              : "Mix of both directions. Decimal pad enabled for % answers."}
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          NUMBER OF QUESTIONS
        </Text>

        <CountPicker value={count} onChange={setCount} accentColor={accent} />

        <Pressable
          onPress={startDrill}
          style={({ pressed }) => [
            styles.startBtn,
            { backgroundColor: accent, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Feather name="zap" size={20} color="#fff" />
          <Text style={styles.startBtnText}>
            {count === 0 ? "Start Drill · ∞ Mode" : `Start Drill · ${count} Questions`}
          </Text>
        </Pressable>
      </ScrollView>

      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 14 },
  header: { alignItems: "center", gap: 6, marginBottom: 4 },
  backBtn: { alignSelf: "flex-start", padding: 4, marginBottom: 4 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 4,
  },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  modeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modeTextWrap: { flex: 1 },
  modeLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modeDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 4,
  },
  startBtnText: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
});
