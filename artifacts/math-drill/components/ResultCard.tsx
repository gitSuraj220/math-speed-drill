import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

interface ResultCardProps {
  isCorrect: boolean;
  correctAnswer: number;
  userAnswer: string;
}

export function ResultCard({
  isCorrect,
  correctAnswer,
  userAnswer,
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

  const bg = isCorrect ? "#dcfce7" : "#fee2e2";
  const fg = isCorrect ? "#15803d" : "#b91c1c";
  const icon = isCorrect ? "check-circle" : "x-circle";

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Feather name={icon} size={28} color={fg} />
      <View style={styles.textGroup}>
        {isCorrect ? (
          <Text style={[styles.label, { color: fg }]}>Correct!</Text>
        ) : (
          <>
            <Text style={[styles.label, { color: fg }]}>Wrong</Text>
            <Text style={[styles.sub, { color: fg }]}>
              Answer: {correctAnswer}
              {userAnswer ? `  (You: ${userAnswer})` : ""}
            </Text>
          </>
        )}
      </View>
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
  textGroup: {
    flex: 1,
  },
  label: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  sub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
