import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { Session } from "@supabase/supabase-js";
import type { PublicPoll } from "../lib/polls";
import { fetchPublicPolls, voteInPoll, createPoll } from "../lib/polls";
import { colors, spacing } from "../theme";

type PollsScreenProps = {
  onOpenProfile: () => void;
  session: Session | null;
};

export function PollsScreen({ onOpenProfile, session }: PollsScreenProps) {
  const [polls, setPolls] = useState<PublicPoll[]>([]);
  const [statusKind, setStatusKind] = useState<"info" | "success" | "error">("info");
  const [statusMessage, setStatusMessage] = useState("Loading public polls...");
  const [isVoting, setIsVoting] = useState(false);

  // States for creating a poll
  const [showCreate, setShowCreate] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [option3, setOption3] = useState("");
  const [option4, setOption4] = useState("");
  const [isSubmittingPoll, setIsSubmittingPoll] = useState(false);

  async function handleCreatePoll() {
    if (!newQuestion.trim() || !option1.trim() || !option2.trim()) {
      Alert.alert("Missing details", "Please enter a question and at least 2 options.");
      return;
    }

    if (!session) {
      Alert.alert("Authentication needed", "Please sign in to create a poll.");
      return;
    }

    setIsSubmittingPoll(true);
    try {
      const optionLabels = [option1, option2, option3, option4].filter((lbl) => lbl.trim());
      await createPoll(newQuestion, optionLabels, session.user.id);
      Alert.alert("Poll Created", "Your poll is now live!");
      setNewQuestion("");
      setOption1("");
      setOption2("");
      setOption3("");
      setOption4("");
      setShowCreate(false);
      
      const nextPolls = await fetchPublicPolls(session.user.id);
      setPolls(nextPolls);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create poll.";
      Alert.alert("Creation failed", message);
    } finally {
      setIsSubmittingPoll(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    fetchPublicPolls(session?.user.id ?? null)
      .then((nextPolls) => {
        if (!isMounted) {
          return;
        }

        setPolls(nextPolls);
        setStatusKind(nextPolls.length > 0 ? "info" : "error");
        setStatusMessage(
          nextPolls.length > 0
            ? "Vote on Pune traffic priorities. Sign in before voting."
            : "No public polls are available yet."
        );
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : "Unable to load polls.";
        setStatusKind("error");
        setStatusMessage(message);
      });

    return () => {
      isMounted = false;
    };
  }, [session]);

  async function handleVote(pollId: string, optionId: string) {
    if (!session) {
      setStatusKind("error");
      setStatusMessage("Please sign in from Profile before voting.");
      return;
    }

    setIsVoting(true);
    setStatusKind("info");
    setStatusMessage("Recording your vote...");

    try {
      await voteInPoll(pollId, optionId, session?.user.id ?? null);
      const nextPolls = await fetchPublicPolls(session?.user.id ?? null);
      setPolls(nextPolls);
      setStatusKind("success");
      setStatusMessage("Vote recorded. Results updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to vote.";
      setStatusKind("error");
      setStatusMessage(message);
    } finally {
      setIsVoting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.kicker}>Polls</Text>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Pune traffic priorities</Text>
        {session ? (
          <TouchableOpacity
            style={styles.createToggle}
            onPress={() => setShowCreate(!showCreate)}
          >
            <Text style={styles.createToggleText}>
              {showCreate ? "Cancel" : "Create Poll"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {showCreate && session ? (
        <View style={styles.panel}>
          <Text style={styles.question}>Create a New Poll</Text>
          <Text style={styles.label}>Question *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Which area needs immediate flyover?"
            value={newQuestion}
            onChangeText={setNewQuestion}
          />
          <Text style={styles.label}>Option 1 *</Text>
          <TextInput
            style={styles.input}
            placeholder="Option 1"
            value={option1}
            onChangeText={setOption1}
          />
          <Text style={styles.label}>Option 2 *</Text>
          <TextInput
            style={styles.input}
            placeholder="Option 2"
            value={option2}
            onChangeText={setOption2}
          />
          <Text style={styles.label}>Option 3 (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Option 3"
            value={option3}
            onChangeText={setOption3}
          />
          <Text style={styles.label}>Option 4 (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Option 4"
            value={option4}
            onChangeText={setOption4}
          />
          <TouchableOpacity
            disabled={isSubmittingPoll}
            onPress={handleCreatePoll}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {isSubmittingPoll ? "Creating..." : "Publish Poll"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={[styles.notice, styles[statusKind]]}>
        <Text style={styles.noticeText}>{statusMessage}</Text>
        {!session ? (
          <TouchableOpacity onPress={onOpenProfile} style={styles.noticeButton}>
            <Text style={styles.noticeButtonText}>Open Profile</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {polls.map((poll) => {
        const totalVotes = poll.options.reduce((sum, option) => sum + option.voteCount, 0);

        return (
          <View style={styles.panel} key={poll.id}>
            <Text style={styles.question}>{poll.question}</Text>
            {poll.options.map((option) => {
              const selected = poll.selectedOptionId === option.id;
              const percent =
                totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;

              return (
                <TouchableOpacity
                  disabled={isVoting}
                  key={option.id}
                  onPress={() => handleVote(poll.id, option.id)}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <View style={styles.optionHeader}>
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.countText, selected && styles.optionTextSelected]}>
                      {option.voteCount} votes
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${percent}%` }]} />
                  </View>
                  <Text style={[styles.percentText, selected && styles.optionTextSelected]}>
                    {percent}% support
                  </Text>
                </TouchableOpacity>
              );
            })}
            <Text style={styles.copy}>{totalVotes} total votes</Text>
          </View>
        );
      })}
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
  notice: {
    borderRadius: 8,
    gap: spacing.sm,
    padding: spacing.md
  },
  info: {
    backgroundColor: colors.paleGreen
  },
  success: {
    backgroundColor: colors.paleGreen
  },
  error: {
    backgroundColor: colors.paleAlert
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
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  question: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: "900",
    lineHeight: 27
  },
  option: {
    borderColor: colors.line,
    borderRadius: 6,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  optionSelected: {
    backgroundColor: colors.road,
    borderColor: colors.road
  },
  optionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  optionText: {
    color: colors.ink,
    flex: 1,
    fontWeight: "900"
  },
  optionTextSelected: {
    color: colors.surface
  },
  countText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900"
  },
  progressTrack: {
    backgroundColor: colors.paleGreen,
    borderRadius: 999,
    height: 8,
    overflow: "hidden"
  },
  progressFill: {
    backgroundColor: colors.signal,
    borderRadius: 999,
    height: "100%"
  },
  percentText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  createToggle: {
    borderColor: colors.road,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  createToggleText: {
    color: colors.road,
    fontWeight: "900",
    fontSize: 13
  },
  label: {
    color: colors.muted,
    fontWeight: "800",
    marginTop: spacing.xs
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 40,
    paddingHorizontal: 10,
    color: colors.ink,
    marginTop: 4
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.road,
    borderRadius: 6,
    justifyContent: "center",
    marginTop: spacing.xs,
    minHeight: 44
  },
  buttonText: {
    color: colors.surface,
    fontWeight: "900"
  }
});
