import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
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
import { useStats } from "@/context/StatsContext";
import { AdBanner } from "@/components/AdBanner";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_SIZE = (SCREEN_W - 48) / 2;

interface DrillCard {
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  badge?: string;
  onPress: () => void;
}

function GridCard({ title, subtitle, icon, color, badge, onPress }: DrillCard) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.gridCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          width: CARD_SIZE,
          height: CARD_SIZE,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {badge && (
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <View style={[styles.cardIconWrap, { backgroundColor: color + "30" }]}>
        <Feather name={icon} size={30} color={color} />
      </View>
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.cardSub, { color: colors.mutedForeground }]} numberOfLines={2}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessions } = useStats();

  const totalCorrect = sessions.reduce((s, r) => s + r.correct, 0);
  const totalQ = sessions.reduce((s, r) => s + r.correct + r.incorrect, 0);
  const accuracy = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const drills: DrillCard[] = [
    {
      title: "TABLE MASTER",
      subtitle: "Multiplication\nTables  1–50",
      icon: "grid",
      color: colors.tableMaster,
      badge: "POPULAR",
      onPress: () => router.push("/table-select"),
    },
    {
      title: "SQUARE / CUBE",
      subtitle: "Powers & Roots\nn² and n³",
      icon: "zap",
      color: colors.squareCube,
      onPress: () => router.push("/squarecube-select"),
    },
    {
      title: "FRACTION %",
      subtitle: "Fractions &\nPercentages",
      icon: "percent",
      color: colors.fractionPct,
      onPress: () => router.push("/fraction-select"),
    },
    {
      title: "LIGHTNING + / −",
      subtitle: "Addition &\nSubtraction Drills",
      icon: "plus-circle",
      color: colors.lightning,
      onPress: () => router.push("/addition-select"),
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 12, paddingBottom: bottomPad + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.appName, { color: colors.foreground }]}>MathDrill</Text>
            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
              Bank Exam Speed Practice
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/stats")}
            style={({ pressed }) => [
              styles.statsBtn,
              { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="bar-chart-2" size={20} color={colors.stats} />
            <Text style={[styles.statsBtnLabel, { color: colors.mutedForeground }]}>Stats</Text>
          </Pressable>
        </View>

        {sessions.length > 0 && (
          <View style={[styles.statsBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { val: totalQ, label: "Attempted", color: colors.primary },
              { val: `${accuracy}%`, label: "Accuracy", color: colors.success },
              { val: sessions.length, label: "Sessions", color: colors.secondary },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <View style={styles.statItem}>
                  <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    {s.label}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          SELECT DRILL MODE
        </Text>

        <View style={styles.grid}>
          {drills.map((d) => (
            <GridCard key={d.title} {...d} />
          ))}
        </View>
      </ScrollView>

      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 16 },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  appName: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  statsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  statsBtnLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  statsBar: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  statItem: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  divider: { width: 1, height: 36 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: -4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  gridCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.5,
  },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  cardSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
});
