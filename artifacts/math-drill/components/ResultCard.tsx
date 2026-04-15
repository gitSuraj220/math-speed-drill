import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

interface ResultCardProps {
  isCorrect: boolean;
  correctAnswer: number;
  userAnswer: string;
  /** Full question text e.g. "7 × 8" — shown in explanation on wrong answers */
  question?: string;
  /** Called when user taps "Got it" on wrong-answer card */
  onContinue?: () => void;
}

export function ResultCard({
  isCorrect,
  correctAnswer,
  userAnswer,
  question,
  onContinue,
}: ResultCardProps) {
  const colors = useColors();

  useEffect(() => {
    if (Platform.OS !== "web") {
      if (isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, [isCorrect]);

  if (isCorrect) {
    return (
      <View style={[styles.container, { backgroundColor: "#dcfce7" }]}>
        <Feather name="check-circle" size={28} color="#15803d" />
        <View style={styles.textGroup}>
          <Text style={[styles.label, { color: "#15803d" }]}>Correct!</Text>
          {question && (
            <Text style={[styles.sub, { color: "#15803d" }]}>
              {question} = {correctAnswer}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // ── Wrong answer — show full explanation ──────────────────────────────
  const hasUserAnswer = userAnswer && userAnswer !== "" && userAnswer !== ".";

  return (
    <View style={[styles.containerWrong, { backgroundColor: "#fff1f2", borderColor: "#fecdd3" }]}>
      {/* Top row */}
      <View style={styles.topRow}>
        <Feather name="x-circle" size={28} color="#b91c1c" />
        <View style={styles.textGroup}>
          <Text style={[styles.label, { color: "#b91c1c" }]}>
            {hasUserAnswer ? "Wrong Answer" : "Time's Up!"}
          </Text>
          {hasUserAnswer && (
            <Text style={[styles.sub, { color: "#b91c1c" }]}>
              You entered:{" "}
              <Text style={{ fontFamily: "Inter_700Bold" }}>{userAnswer}</Text>
            </Text>
          )}
        </View>
      </View>

      {/* Explanation box */}
      <View style={[styles.explanationBox, { backgroundColor: "#fee2e2", borderColor: "#fca5a5" }]}>
        <Text style={styles.explanationLabel}>CORRECT ANSWER</Text>
        <Text style={styles.explanationEquation}>
          {question ? `${question} = ` : ""}
          <Text style={styles.answerHighlight}>{correctAnswer}</Text>
        </Text>
      </View>

      {/* Got it button */}
      {onContinue && (
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [styles.gotItBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.gotItText}>Got it</Text>
          <Feather name="arrow-right" size={16} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
  },
  containerWrong: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textGroup: {
    flex: 1,
  },
  label: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  sub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  explanationBox: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 3,
  },
  explanationLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "#991b1b",
    letterSpacing: 0.8,
  },
  explanationEquation: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: "#b91c1c",
  },
  answerHighlight: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#991b1b",
  },
  gotItBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#b91c1c",
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 2,
  },
  gotItText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
