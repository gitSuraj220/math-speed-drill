import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export function AdBanner() {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.adPlaceholder }]}>
      <Text style={[styles.text, { color: colors.mutedForeground }]}>
        Advertisement
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  text: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
