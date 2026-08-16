import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing } from "../theme";

const options = [
  "Better signal timing",
  "Complete road work faster",
  "Remove illegal parking",
  "Improve PMPML priority"
];

export function PollsScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View style={styles.screen}>
      <Text style={styles.kicker}>Polls</Text>
      <Text style={styles.title}>What should Pune fix first?</Text>
      <View style={styles.panel}>
        {options.map((option) => {
          const active = selected === option;
          return (
            <TouchableOpacity
              key={option}
              onPress={() => setSelected(option)}
              style={[styles.option, active && styles.optionSelected]}
            >
              <Text style={[styles.optionText, active && styles.optionTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.copy}>
        Voting is local for this first build. The Supabase poll tables are already
        prepared for the server-backed version.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.md
  },
  kicker: {
    color: colors.civic,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 37
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  option: {
    borderColor: colors.line,
    borderRadius: 6,
    borderWidth: 1,
    padding: spacing.md
  },
  optionSelected: {
    backgroundColor: colors.road,
    borderColor: colors.road
  },
  optionText: {
    color: colors.ink,
    fontWeight: "800"
  },
  optionTextSelected: {
    color: colors.surface
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22
  }
});
