import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface TimerBarProps {
  progress: number;
}

export function TimerBar({ progress }: TimerBarProps) {
  const colors = useColors();
  const animValue = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const barColor =
    progress > 0.5
      ? colors.timerBar
      : progress > 0.25
        ? colors.timerBarWarning
        : colors.timerBarDanger;

  const widthPercent = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.track, { backgroundColor: colors.muted }]}>
      <Animated.View
        style={[styles.bar, { width: widthPercent, backgroundColor: barColor }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    width: "100%",
  },
  bar: {
    height: "100%",
    borderRadius: 4,
  },
});
