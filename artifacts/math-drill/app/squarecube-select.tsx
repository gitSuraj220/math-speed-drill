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
    <View style={[styles.stepperBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.stepperLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <View style={styles.stepperInner}>
        <Pressable
          onPress={() => onChange(Math.max(min, value - 1))}
          style={({ pressed }) => [
            styles.stepBtn,
            { backgroundColor: colors.muted, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="minus" size={18} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.stepVal, { color }]}>{value}</Text>
        <Pressable
          onPress={() => onChange(Math.min(max, value + 1))}
          style={({ pressed }) => [
            styles.stepBtn,
            { backgroundColor: colors.muted, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="plus" size={18} color={colors.foreground} />
        </Pressable>
      </View>
    </View>
  );
}

type DrillType = "squares" | "cubes" | "mixed";

export default function SquareCubeSelectScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [drillType, setDrillType] = useState<DrillType>("mixed");
  const [sqFrom, setSqFrom] = useState(1);
  const [sqTo, setSqTo] = useState(30);
  const [cbFrom, setCbFrom] = useState(1);
  const [cbTo, setCbTo] = useState(20);
  const [count, setCount] = useState(10);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSqFrom = (v: number) => { setSqFrom(v); if (v > sqTo) setSqTo(v); };
  const handleSqTo = (v: number) => { setSqTo(v); if (v < sqFrom) setSqFrom(v); };
  const handleCbFrom = (v: number) => { setCbFrom(v); if (v > cbTo) setCbTo(v); };
  const handleCbTo = (v: number) => { setCbTo(v); if (v < cbFrom) setCbFrom(v); };

  const startDrill = () => {
    router.push({
      pathname: "/quiz",
      params: {
        mode: "squarecube",
        drillType,
        sqFrom: String(sqFrom),
        sqTo: String(sqTo),
        cbFrom: String(cbFrom),
        cbTo: String(cbTo),
        questionCount: String(count),
      },
    });
  };

  const TypeChip = ({ type, label, icon }: { type: DrillType; label: string; icon: keyof typeof Feather.glyphMap }) => (
    <Pressable
      onPress={() => setDrillType(type)}
      style={({ pressed }) => [
        styles.typeChip,
        {
          backgroundColor: drillType === type ? colors.squareCube : colors.card,
          borderColor: drillType === type ? colors.squareCube : colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Feather name={icon} size={15} color={drillType === type ? "#fff" : colors.mutedForeground} />
      <Text style={[styles.typeChipText, { color: drillType === type ? "#fff" : colors.foreground }]}>
        {label}
      </Text>
    </Pressable>
  );

  const showSquares = drillType === "squares" || drillType === "mixed";
  const showCubes = drillType === "cubes" || drillType === "mixed";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Square / Cube Drill</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DRILL TYPE</Text>
        <View style={styles.typeRow}>
          <TypeChip type="squares" label="Squares only" icon="square" />
          <TypeChip type="cubes" label="Cubes only" icon="box" />
          <TypeChip type="mixed" label="Mixed" icon="shuffle" />
        </View>

        {showSquares && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
              SQUARES RANGE (n² where n = ?)
            </Text>
            <View style={styles.stepRow}>
              <Stepper label="From" value={sqFrom} min={1} max={100} onChange={handleSqFrom} color={colors.squareCube} />
              <View style={styles.arrow}><Feather name="arrow-right" size={18} color={colors.mutedForeground} /></View>
              <Stepper label="To" value={sqTo} min={1} max={100} onChange={handleSqTo} color={colors.squareCube} />
            </View>
            <View style={[styles.rangePreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.rangePreviewText, { color: colors.squareCube }]}>
                n² for n = {sqFrom} to {sqTo}
              </Text>
              <Text style={[styles.rangePreviewSub, { color: colors.mutedForeground }]}>
                e.g. {sqFrom}² = {sqFrom * sqFrom},  {sqTo}² = {sqTo * sqTo}
              </Text>
            </View>
          </>
        )}

        {showCubes && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
              CUBES RANGE (n³ where n = ?)
            </Text>
            <View style={styles.stepRow}>
              <Stepper label="From" value={cbFrom} min={1} max={50} onChange={handleCbFrom} color={colors.squareCube} />
              <View style={styles.arrow}><Feather name="arrow-right" size={18} color={colors.mutedForeground} /></View>
              <Stepper label="To" value={cbTo} min={1} max={50} onChange={handleCbTo} color={colors.squareCube} />
            </View>
            <View style={[styles.rangePreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.rangePreviewText, { color: colors.squareCube }]}>
                n³ for n = {cbFrom} to {cbTo}
              </Text>
              <Text style={[styles.rangePreviewSub, { color: colors.mutedForeground }]}>
                e.g. {cbFrom}³ = {cbFrom ** 3},  {cbTo}³ = {cbTo ** 3}
              </Text>
            </View>
          </>
        )}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
          NUMBER OF QUESTIONS
        </Text>
        <CountPicker value={count} onChange={setCount} accentColor={colors.squareCube} />

        <View style={[styles.summaryCard, { backgroundColor: "#f3e8ff", borderColor: "#d8b4fe" }]}>
          <Feather name="info" size={16} color="#7c3aed" />
          <Text style={[styles.summaryText, { color: "#5b21b6" }]}>
            {count} questions · {drillType === "mixed" ? "Squares + Cubes" : drillType === "squares" ? "Squares only" : "Cubes only"}
          </Text>
        </View>

        <Pressable
          onPress={startDrill}
          style={({ pressed }) => [
            styles.startBtn,
            { backgroundColor: colors.squareCube, opacity: pressed ? 0.85 : 1 },
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
  scroll: { padding: 20, gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  typeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  typeChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  arrow: { paddingTop: 18 },
  stepperBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 8,
  },
  stepperLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 1 },
  stepperInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  stepVal: { fontSize: 28, fontFamily: "Inter_700Bold", minWidth: 40, textAlign: "center" },
  rangePreview: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  rangePreviewText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  rangePreviewSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
  },
  summaryText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 8,
  },
  startBtnText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#ffffff" },
});
