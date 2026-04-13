import { useRouter } from "expo-router";
import React from "react";
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
import { useStats } from "@/context/StatsContext";
import { AdBanner } from "@/components/AdBanner";

interface ModeCardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  onPress: () => void;
}

function ModeCard({ title, subtitle, icon, color, onPress }: ModeCardProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: color, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.cardIcon}>
        <Feather name={icon} size={32} color="#ffffff" />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />
    </Pressable>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessions } = useStats();

  const totalCorrect = sessions.reduce((s, r) => s + r.correct, 0);
  const totalQuestions = sessions.reduce(
    (s, r) => s + r.correct + r.incorrect,
    0
  );
  const accuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.appName, { color: colors.primary }]}>
            MathDrill
          </Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Bank Exam Speed Practice
          </Text>
        </View>

        {sessions.length > 0 && (
          <View
            style={[styles.quickStats, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {totalQuestions}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Attempted
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {accuracy}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Accuracy
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.secondary }]}>
                {sessions.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Sessions
              </Text>
            </View>
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          SELECT MODE
        </Text>

        <ModeCard
          title="Table Master"
          subtitle="Multiplication Tables  ·  1–50"
          icon="grid"
          color={colors.tableMaster}
          onPress={() => router.push("/table-select")}
        />
        <ModeCard
          title="Square / Cube Drill"
          subtitle="Squares 1–100  ·  Cubes 1–50"
          icon="zap"
          color={colors.squareCube}
          onPress={() => router.push({ pathname: "/quiz", params: { mode: "squarecube" } })}
        />
        <ModeCard
          title="Lightning Addition"
          subtitle="4-Digit Speed Addition"
          icon="plus-circle"
          color={colors.lightning}
          onPress={() => router.push({ pathname: "/quiz", params: { mode: "addition" } })}
        />
        <ModeCard
          title="Performance Stats"
          subtitle="Your speed & accuracy"
          icon="bar-chart-2"
          color={colors.stats}
          onPress={() => router.push("/stats")}
        />
      </ScrollView>

      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  header: {
    marginBottom: 8,
  },
  appName: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  quickStats: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 4,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
});
