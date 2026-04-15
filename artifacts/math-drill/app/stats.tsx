import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
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
import { useStats, SessionRecord } from "@/context/StatsContext";
import { AdBanner } from "@/components/AdBanner";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getModeCategory(mode: string): string {
  if (mode.includes("Table") || mode.includes("table")) return "Table Master";
  if (mode.includes("Square") || mode.includes("Cube")) return "Square / Cube";
  if (mode.includes("Lightning") || mode.includes("Addition")) return "Lightning +";
  if (mode.includes("Fraction") || mode.includes("%")) return "Fraction %";
  return "Other";
}

function getModeColor(mode: string, colors: ReturnType<typeof useColors>) {
  if (mode.includes("Table")) return colors.tableMaster;
  if (mode.includes("Square") || mode.includes("Cube")) return colors.squareCube;
  if (mode.includes("Lightning") || mode.includes("Addition")) return colors.lightning;
  if (mode.includes("Fraction") || mode.includes("%")) return colors.fractionPct ?? "#be185d";
  return colors.stats;
}

function getModeIcon(category: string): React.ComponentProps<typeof Feather>["name"] {
  if (category === "Table Master") return "grid";
  if (category === "Square / Cube") return "box";
  if (category === "Lightning +") return "zap";
  if (category === "Fraction %") return "percent";
  return "bar-chart-2";
}

// ── Per-mode breakdown ─────────────────────────────────────────────────────

interface ModeStat {
  category: string;
  sessions: number;
  totalCorrect: number;
  totalQ: number;
  avgTimeMs: number;
  accuracy: number;
}

function buildModeStats(sessions: SessionRecord[]): ModeStat[] {
  const map = new Map<string, { correct: number; total: number; timeMsSum: number; sessions: number }>();

  for (const s of sessions) {
    const cat = getModeCategory(s.mode);
    const existing = map.get(cat) ?? { correct: 0, total: 0, timeMsSum: 0, sessions: 0 };
    existing.correct += s.correct;
    existing.total += s.correct + s.incorrect;
    existing.timeMsSum += s.avgTimeMs;
    existing.sessions += 1;
    map.set(cat, existing);
  }

  return Array.from(map.entries())
    .map(([category, d]) => ({
      category,
      sessions: d.sessions,
      totalCorrect: d.correct,
      totalQ: d.total,
      avgTimeMs: d.sessions > 0 ? Math.round(d.timeMsSum / d.sessions) : 0,
      accuracy: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy); // weakest first
}

function ModeBreakdown({ sessions }: { sessions: SessionRecord[] }) {
  const colors = useColors();
  const modeStats = buildModeStats(sessions);
  if (modeStats.length === 0) return null;

  const weakest = modeStats[0];

  return (
    <View style={[mStyles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[mStyles.heading, { color: colors.foreground }]}>
        Mode Breakdown
      </Text>

      {/* Weakest mode callout */}
      <View style={[mStyles.weakBadge, { backgroundColor: colors.destructive + "22", borderColor: colors.destructive + "55" }]}>
        <Feather name="alert-circle" size={14} color={colors.destructive} />
        <Text style={[mStyles.weakText, { color: colors.destructive }]}>
          Weakest: <Text style={{ fontFamily: "Inter_700Bold" }}>{weakest.category}</Text> — {weakest.accuracy}% accuracy
        </Text>
      </View>

      {/* Mode rows */}
      {modeStats.map((stat) => {
        const isWeakest = stat.category === weakest.category;
        const barColor = stat.accuracy >= 80
          ? colors.success
          : stat.accuracy >= 60
          ? "#f59e0b"
          : colors.destructive;

        return (
          <View key={stat.category} style={mStyles.modeRow}>
            <View style={mStyles.modeLeft}>
              <View style={[mStyles.modeIconBox, { backgroundColor: getModeColor(stat.category, colors) + "30" }]}>
                <Feather name={getModeIcon(stat.category)} size={14} color={getModeColor(stat.category, colors)} />
              </View>
              <View>
                <Text style={[mStyles.modeName, { color: colors.foreground }]}>
                  {stat.category}
                  {isWeakest && (
                    <Text style={{ color: colors.destructive, fontSize: 11 }}> ⚠</Text>
                  )}
                </Text>
                <Text style={[mStyles.modeMeta, { color: colors.mutedForeground }]}>
                  {stat.sessions} session{stat.sessions !== 1 ? "s" : ""} · {Math.round(stat.avgTimeMs / 1000)}s avg
                </Text>
              </View>
            </View>

            <View style={mStyles.modeRight}>
              {/* Accuracy bar */}
              <View style={[mStyles.barTrack, { backgroundColor: colors.border }]}>
                <View style={[mStyles.barFill, { width: `${stat.accuracy}%` as any, backgroundColor: barColor }]} />
              </View>
              <Text style={[mStyles.modeAcc, { color: barColor }]}>
                {stat.accuracy}%
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Session list item ──────────────────────────────────────────────────────

function SessionItem({ item }: { item: SessionRecord }) {
  const colors = useColors();
  const total = item.correct + item.incorrect;
  const acc = total > 0 ? Math.round((item.correct / total) * 100) : 0;
  const modeColor = getModeColor(item.mode, colors);

  return (
    <View
      style={[
        styles.sessionCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.modeDot, { backgroundColor: modeColor }]} />
      <View style={styles.sessionInfo}>
        <Text style={[styles.sessionMode, { color: colors.foreground }]}>
          {item.mode}
        </Text>
        <Text style={[styles.sessionDate, { color: colors.mutedForeground }]}>
          {formatDate(item.date)}
        </Text>
      </View>
      <View style={styles.sessionStats}>
        <Text style={[styles.sessionAcc, { color: acc >= 70 ? colors.success : colors.destructive }]}>
          {acc}%
        </Text>
        <Text style={[styles.sessionDetail, { color: colors.mutedForeground }]}>
          {item.correct}/{total}  ·  {Math.round(item.avgTimeMs / 1000)}s
        </Text>
      </View>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

type Tab = "breakdown" | "history";

export default function StatsScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessions, clearStats } = useStats();
  const [tab, setTab] = useState<Tab>("breakdown");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const totalCorrect = sessions.reduce((s, r) => s + r.correct, 0);
  const totalQ = sessions.reduce((s, r) => s + r.correct + r.incorrect, 0);
  const overallAcc = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
  const avgTimeMs =
    sessions.length > 0
      ? Math.round(sessions.reduce((s, r) => s + r.avgTimeMs, 0) / sessions.length / 1000)
      : 0;

  const handleClear = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Delete all session history?")) clearStats();
      return;
    }
    Alert.alert("Clear Stats", "Delete all session history?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearStats },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Performance Stats
        </Text>
        {sessions.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearBtn}>
            <Feather name="trash-2" size={20} color={colors.destructive} />
          </Pressable>
        )}
      </View>

      {/* Summary row */}
      {sessions.length > 0 && (
        <View style={[styles.summaryRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.sumStat}>
            <Text style={[styles.sumVal, { color: colors.primary }]}>{sessions.length}</Text>
            <Text style={[styles.sumLabel, { color: colors.mutedForeground }]}>Sessions</Text>
          </View>
          <View style={[styles.sumDivider, { backgroundColor: colors.border }]} />
          <View style={styles.sumStat}>
            <Text style={[styles.sumVal, { color: colors.success }]}>{overallAcc}%</Text>
            <Text style={[styles.sumLabel, { color: colors.mutedForeground }]}>Accuracy</Text>
          </View>
          <View style={[styles.sumDivider, { backgroundColor: colors.border }]} />
          <View style={styles.sumStat}>
            <Text style={[styles.sumVal, { color: colors.secondary }]}>{avgTimeMs}s</Text>
            <Text style={[styles.sumLabel, { color: colors.mutedForeground }]}>Avg Speed</Text>
          </View>
          <View style={[styles.sumDivider, { backgroundColor: colors.border }]} />
          <View style={styles.sumStat}>
            <Text style={[styles.sumVal, { color: colors.foreground }]}>{totalQ}</Text>
            <Text style={[styles.sumLabel, { color: colors.mutedForeground }]}>Questions</Text>
          </View>
        </View>
      )}

      {/* Tab switcher */}
      {sessions.length > 0 && (
        <View style={[styles.tabs, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          {(["breakdown", "history"] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            >
              <Text style={[styles.tabText, { color: tab === t ? colors.primary : colors.mutedForeground }]}>
                {t === "breakdown" ? "By Mode" : "History"}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="bar-chart-2" size={48} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No sessions yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Complete a drill to see your stats here
          </Text>
        </View>
      ) : tab === "breakdown" ? (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 16 }}
          showsVerticalScrollIndicator={false}
        >
          <ModeBreakdown sessions={sessions} />
        </ScrollView>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SessionItem item={item} />}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 16 }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <AdBanner />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const mStyles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  heading: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  weakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  weakText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  modeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  modeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modeName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  modeMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  modeRight: {
    alignItems: "flex-end",
    gap: 4,
    minWidth: 90,
  },
  barTrack: {
    width: 80,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  modeAcc: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold" },
  clearBtn: { padding: 4 },
  summaryRow: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  sumStat: { flex: 1, alignItems: "center" },
  sumVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  sumLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  sumDivider: { width: 1 },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  list: { padding: 16, gap: 10 },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  modeDot: { width: 10, height: 10, borderRadius: 5 },
  sessionInfo: { flex: 1 },
  sessionMode: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  sessionDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  sessionStats: { alignItems: "flex-end" },
  sessionAcc: { fontSize: 18, fontFamily: "Inter_700Bold" },
  sessionDetail: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
