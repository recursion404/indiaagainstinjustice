import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { submitPledge } from "../lib/pledges";
import { colors, spacing } from "../theme";

export function PledgeScreen() {
  const [name, setName] = useState("");
  const [pledged, setPledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePledge() {
    setIsSubmitting(true);
    try {
      await submitPledge(name);
      setPledged(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to record pledge.";
      Alert.alert("Pledge paused", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.kicker}>Traffic rules pledge</Text>
      <Text style={styles.title}>I will follow all traffic rules</Text>
      <View style={styles.panel}>
        <Text style={styles.copy}>
          I will respect signals, avoid wrong-side driving, keep lanes clear, not block
          public transport stops and support safer Pune roads.
        </Text>
        <TextInput
          onChangeText={setName}
          placeholder="Your public name"
          style={styles.input}
          value={name}
        />
        <TouchableOpacity
          disabled={isSubmitting || pledged}
          onPress={handlePledge}
          style={[styles.button, pledged && styles.buttonDone]}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? "Recording..." : pledged ? "Pledge recorded" : "Take pledge"}
          </Text>
        </TouchableOpacity>
      </View>
      {pledged ? (
        <Text style={styles.copy}>
          Thank you{name.trim() ? `, ${name.trim()}` : ""}. This will connect to the
          Supabase pledge table in the next backend pass.
        </Text>
      ) : null}
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
    gap: spacing.md,
    padding: spacing.md
  },
  copy: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 46,
    paddingHorizontal: 12
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.road,
    borderRadius: 6,
    justifyContent: "center",
    minHeight: 48
  },
  buttonDone: {
    backgroundColor: colors.civic
  },
  buttonText: {
    color: colors.surface,
    fontWeight: "900"
  }
});
