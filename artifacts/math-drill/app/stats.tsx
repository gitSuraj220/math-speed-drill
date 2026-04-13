import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
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

function getModeColor(mode: string, colors: ReturnType<typeof useColors>) {
  if (mode.includes("Table")) return colors.tableMaster;
  if (mode.includes("Square") || mode.includes("Cube")) return colors.squareCube;
  if (mode.includes("Lightning")) return colors.lightning;
  return colors.stats;
}

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

export default function StatsScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessions, clearStats } = useStats();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const totalCorrect = sessions.reduce((s, r) => s + r.correct, 0);
  const totalQ = sessions.reduce((s, r) => s + r.correct + r.incorrect, 0);
  const overallAcc = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
  const avgTimeMs =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((s, r) => s + r.avgTimeMs, 0) / sessions.length / 1000
        )
      : 0;

  const handleClear = () => {
    Alert.alert("Clear Stats", "Delete all session history?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearStats },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
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

      {sessions.length > 0 && (
        <View
          style={[
            styles.summaryRow,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <View style={styles.sumStat}>
            <Text style={[styles.sumVal, { color: colors.primary }]}>
              {sessions.length}
            </Text>
            <Text style={[styles.sumLabel, { color: colors.mutedForeground }]}>
              Sessions
            </Text>
          </View>
          <View style={[styles.sumDivider, { backgroundColor: colors.border }]} />
          <View style={styles.sumStat}>
            <Text style={[styles.sumVal, { color: colors.success }]}>
              {overallAcc}%
            </Text>
            <Text style={[styles.sumLabel, { color: colors.mutedForeground }]}>
              Accuracy
            </Text>
          </View>
          <View style={[styles.sumDivider, { backgroundColor: colors.border }]} />
          <View style={styles.sumStat}>
            <Text style={[styles.sumVal, { color: colors.secondary }]}>
              {avgTimeMs}s
            </Text>
            <Text style={[styles.sumLabel, { color: colors.mutedForeground }]}>
              Avg Speed
            </Text>
          </View>
          <View style={[styles.sumDivider, { backgroundColor: colors.border }]} />
          <View style={styles.sumStat}>
            <Text style={[styles.sumVal, { color: colors.foreground }]}>
              {totalQ}
            </Text>
            <Text style={[styles.sumLabel, { color: colors.mutedForeground }]}>
              Questions
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SessionItem item={item} />}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomPad + 16 },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="bar-chart-2" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No sessions yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Complete a drill to see your stats here
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  clearBtn: {
    padding: 4,
  },
  summaryRow: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  sumStat: {
    flex: 1,
    alignItems: "center",
  },
  sumVal: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  sumLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  sumDivider: {
    width: 1,
  },
  list: {
    padding: 16,
    gap: 10,
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  modeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionMode: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  sessionDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  sessionStats: {
    alignItems: "flex-end",
  },
  sessionAcc: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  sessionDetail: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
