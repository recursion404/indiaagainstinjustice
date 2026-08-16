import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { fetchPledgeCount, submitPledge } from "../lib/pledges";
import { colors, spacing } from "../theme";

type PledgeScreenProps = {
  onOpenProfile: () => void;
  session: Session | null;
};

export function PledgeScreen({ onOpenProfile, session }: PledgeScreenProps) {
  const [name, setName] = useState("");
  const [pledged, setPledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pledgeCount, setPledgeCount] = useState(0);
  const [statusKind, setStatusKind] = useState<"info" | "success" | "error">("info");
  const [statusMessage, setStatusMessage] = useState(
    "Sign in from Profile before taking the pledge."
  );

  useEffect(() => {
    let isMounted = true;

    fetchPledgeCount()
      .then((count) => {
        if (isMounted) {
          setPledgeCount(count);
        }
      })
      .catch((error) => {
        if (isMounted) {
          const message = error instanceof Error ? error.message : "Unable to load pledge count.";
          setStatusKind("error");
          setStatusMessage(message);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [pledged]);

  async function handlePledge() {
    if (!session) {
      setStatusKind("error");
      setStatusMessage("Please sign in from Profile before taking the pledge.");
      return;
    }

    setIsSubmitting(true);
    setStatusKind("info");
    setStatusMessage("Recording your pledge...");
    try {
      await submitPledge(name, session?.user.id ?? null);
      setPledged(true);
      setStatusKind("success");
      setStatusMessage("Pledge recorded. Thank you for supporting safer Pune roads.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to record pledge.";
      setStatusKind("error");
      setStatusMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.kicker}>Traffic rules pledge</Text>
      <Text style={styles.title}>I will follow all traffic rules</Text>
      <View style={[styles.notice, styles[statusKind]]}>
        <Text style={styles.noticeText}>{statusMessage}</Text>
        {!session ? (
          <TouchableOpacity onPress={onOpenProfile} style={styles.noticeButton}>
            <Text style={styles.noticeButtonText}>Open Profile</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.panel}>
        <Text style={styles.count}>{pledgeCount} citizens have taken the pledge.</Text>
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
  notice: {
    borderRadius: 8,
    gap: spacing.sm,
    padding: spacing.md
  },
  info: {
    backgroundColor: colors.paleGreen
  },
  success: {
    backgroundColor: "#dff3e6"
  },
  error: {
    backgroundColor: "#f8e3df"
  },
  noticeText: {
    color: colors.ink,
    fontWeight: "800",
    lineHeight: 20
  },
  noticeButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.road,
    borderRadius: 6,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 14
  },
  noticeButtonText: {
    color: colors.surface,
    fontWeight: "900"
  },
  count: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900"
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
