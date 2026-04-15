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

type Operation = "add" | "sub" | "mixed";
type DigitCombo = "1+1" | "1+2" | "2+2" | "2+3" | "3+3" | "3+4" | "4+4" | "mixed";

const OPERATIONS: { key: Operation; label: string; icon: keyof typeof Feather.glyphMap; desc: string }[] = [
  { key: "add",   label: "Addition",    icon: "plus",   desc: "e.g. 45 + 312 = ?" },
  { key: "sub",   label: "Subtraction", icon: "minus",  desc: "e.g. 87 − 34 = ?" },
  { key: "mixed", label: "Mixed",       icon: "shuffle",desc: "Both + and − randomly" },
];

interface Combo { key: DigitCombo; label: string; d1: number; d2: number }
const COMBOS: Combo[] = [
  { key: "1+1", label: "1 + 1", d1: 1, d2: 1 },
  { key: "1+2", label: "1 + 2", d1: 1, d2: 2 },
  { key: "2+2", label: "2 + 2", d1: 2, d2: 2 },
  { key: "2+3", label: "2 + 3", d1: 2, d2: 3 },
  { key: "3+3", label: "3 + 3", d1: 3, d2: 3 },
  { key: "3+4", label: "3 + 4", d1: 3, d2: 4 },
  { key: "4+4", label: "4 + 4", d1: 4, d2: 4 },
  { key: "mixed", label: "Mixed", d1: 0, d2: 0 },
];

function exampleQuestion(op: Operation, combo: DigitCombo): string {
  const examples: Record<DigitCombo, string> = {
    "1+1":  op === "add" ? "7 + 8 = ?"   : "9 − 4 = ?",
    "1+2":  op === "add" ? "6 + 43 = ?"  : "52 − 7 = ?",
    "2+2":  op === "add" ? "34 + 57 = ?" : "87 − 34 = ?",
    "2+3":  op === "add" ? "45 + 312 = ?" : "534 − 28 = ?",
    "3+3":  op === "add" ? "312 + 456 = ?" : "872 − 345 = ?",
    "3+4":  op === "add" ? "412 + 3056 = ?" : "5320 − 412 = ?",
    "4+4":  op === "add" ? "4523 + 3841 = ?" : "8732 − 4215 = ?",
    "mixed": "Random mix of all digit sizes",
  };
  if (op === "mixed") return "Mix of + and − e.g. 45 + 23, 87 − 34";
  return examples[combo];
}

export default function AdditionSelectScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [operation, setOperation] = useState<Operation>("add");
  const [digitCombo, setDigitCombo] = useState<DigitCombo>("2+2");
  const [count, setCount] = useState(20);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const accent = colors.lightning;

  const startDrill = () => {
    const combo = COMBOS.find((c) => c.key === digitCombo)!;
    router.push({
      pathname: "/quiz",
      params: {
        mode: "addition",
        operation,
        digits1: String(combo.d1),
        digits2: String(combo.d2),
        digitCombo,
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
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Lightning + / −</Text>
          <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
            Choose operation and digit size
          </Text>
        </View>

        {/* Operation picker */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>OPERATION</Text>
        <View style={styles.opRow}>
          {OPERATIONS.map((op) => {
            const active = operation === op.key;
            return (
              <Pressable
                key={op.key}
                onPress={() => setOperation(op.key)}
                style={[
                  styles.opCard,
                  { backgroundColor: colors.card, borderColor: active ? accent : colors.border, borderWidth: active ? 2 : 1 },
                ]}
              >
                <View style={[styles.opIcon, { backgroundColor: active ? accent + "22" : colors.muted + "22" }]}>
                  <Feather name={op.icon} size={20} color={active ? accent : colors.mutedForeground} />
                </View>
                <Text style={[styles.opLabel, { color: active ? accent : colors.foreground }]}>{op.label}</Text>
                <Text style={[styles.opDesc, { color: colors.mutedForeground }]}>{op.desc}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Digit combo picker */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DIGIT SIZE</Text>
        <View style={styles.comboGrid}>
          {COMBOS.map((c) => {
            const active = digitCombo === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => setDigitCombo(c.key)}
                style={[
                  styles.comboChip,
                  {
                    backgroundColor: active ? accent : colors.card,
                    borderColor: active ? accent : colors.border,
                  },
                ]}
              >
                <Text style={[styles.comboLabel, { color: active ? "#fff" : colors.foreground }]}>
                  {c.label}
                </Text>
                {c.key !== "mixed" && (
                  <Text style={[styles.comboSub, { color: active ? "#ffffffaa" : colors.mutedForeground }]}>
                    {c.d1 === 1 ? "1–9" : c.d1 === 2 ? "10–99" : c.d1 === 3 ? "100–999" : "1000–9999"}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Preview */}
        <View style={[styles.preview, { backgroundColor: accent + "15", borderColor: accent + "40" }]}>
          <Text style={[styles.previewLabel, { color: accent }]}>EXAMPLE</Text>
          <Text style={[styles.previewText, { color: colors.foreground }]}>
            {exampleQuestion(operation, digitCombo)}
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
  comboGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  comboChip: {
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10,
    alignItems: "center", minWidth: 70,
  },
  comboLabel: { fontSize: 15, fontFamily: "Inter_700Bold" },
  comboSub: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
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
