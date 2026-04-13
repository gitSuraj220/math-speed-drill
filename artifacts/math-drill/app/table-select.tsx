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

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  color,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.stepperContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.stepperLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <View style={styles.stepperRow}>
        <Pressable
          onPress={() => onChange(Math.max(min, value - 1))}
          style={({ pressed }) => [
            styles.stepBtn,
            { backgroundColor: colors.muted, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="minus" size={20} color={colors.foreground} />
        </Pressable>

        <Text style={[styles.stepValue, { color }]}>{value}</Text>

        <Pressable
          onPress={() => onChange(Math.min(max, value + 1))}
          style={({ pressed }) => [
            styles.stepBtn,
            { backgroundColor: colors.muted, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="plus" size={20} color={colors.foreground} />
        </Pressable>
      </View>
    </View>
  );
}

const QUICK_PICKS = [
  { label: "2–10", from: 2, to: 10 },
  { label: "11–20", from: 11, to: 20 },
  { label: "12–19", from: 12, to: 19 },
  { label: "20–30", from: 20, to: 30 },
  { label: "30–50", from: 30, to: 50 },
  { label: "All 1–50", from: 1, to: 50 },
];

export default function TableSelectScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [from, setFrom] = useState(12);
  const [to, setTo] = useState(20);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSetFrom = (v: number) => {
    setFrom(v);
    if (v > to) setTo(v);
  };

  const handleSetTo = (v: number) => {
    setTo(v);
    if (v < from) setFrom(v);
  };

  const startDrill = () => {
    router.push({
      pathname: "/quiz",
      params: { mode: "tables", tableFrom: String(from), tableTo: String(to) },
    });
  };

  const rangeCount = to - from + 1;
  const rangeLabel =
    from === to ? `Table of ${from}` : `Tables ${from} to ${to}`;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 16, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Table Master
        </Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomPad + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          QUICK SELECT
        </Text>
        <View style={styles.quickGrid}>
          {QUICK_PICKS.map((q) => {
            const active = q.from === from && q.to === to;
            return (
              <Pressable
                key={q.label}
                onPress={() => {
                  setFrom(q.from);
                  setTo(q.to);
                }}
                style={({ pressed }) => [
                  styles.quickChip,
                  {
                    backgroundColor: active
                      ? colors.tableMaster
                      : colors.card,
                    borderColor: active ? colors.tableMaster : colors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.quickChipText,
                    { color: active ? "#fff" : colors.foreground },
                  ]}
                >
                  {q.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text
          style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 24 }]}
        >
          CUSTOM RANGE
        </Text>

        <View style={styles.stepperRow}>
          <Stepper
            label="From"
            value={from}
            min={1}
            max={50}
            onChange={handleSetFrom}
            color={colors.tableMaster}
          />
          <View style={styles.rangeSep}>
            <Feather name="arrow-right" size={20} color={colors.mutedForeground} />
          </View>
          <Stepper
            label="To"
            value={to}
            min={1}
            max={50}
            onChange={handleSetTo}
            color={colors.tableMaster}
          />
        </View>

        <View
          style={[
            styles.previewCard,
            { backgroundColor: colors.accent, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.previewLabel, { color: colors.accentForeground }]}>
            Selected
          </Text>
          <Text style={[styles.previewRange, { color: colors.tableMaster }]}>
            {rangeLabel}
          </Text>
          <Text style={[styles.previewCount, { color: colors.accentForeground }]}>
            {rangeCount === 1
              ? "Single table drill"
              : `${rangeCount} tables · 10 questions`}
          </Text>
        </View>

        <Pressable
          onPress={startDrill}
          style={({ pressed }) => [
            styles.startBtn,
            {
              backgroundColor: colors.tableMaster,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Feather name="zap" size={20} color="#fff" />
          <Text style={styles.startBtnText}>Start Drill</Text>
        </Pressable>
      </ScrollView>

      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  title: {
    flex: 1,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  scroll: {
    padding: 20,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  quickChipText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rangeSep: {
    paddingTop: 20,
  },
  stepperContainer: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 10,
  },
  stepperLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  stepValue: {
    fontSize: 34,
    fontFamily: "Inter_700Bold",
    minWidth: 48,
    textAlign: "center",
  },
  previewCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  previewRange: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  previewCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 8,
  },
  startBtnText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
});
