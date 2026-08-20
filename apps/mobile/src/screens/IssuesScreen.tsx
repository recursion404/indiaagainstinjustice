import { useEffect, useMemo, useState } from "react";
import { Alert, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { PublicIssue } from "@citizens-first/shared";
import type { Session } from "@supabase/supabase-js";
import { IssueCard } from "../components/IssueCard";
import {
  confirmIssueObservation,
  fetchMyIssueConfirmations,
  fetchMySharedIssueIds,
  fetchMyIssues,
  fetchMySupportedIssueIds,
  fetchPublicIssues,
  recordIssueShare,
  removeIssueSupport,
  supportIssue
} from "../lib/issues";
import { colors, spacing } from "../theme";

type IssuesScreenProps = {
  onOpenProfile: () => void;
  session: Session | null;
};

type IssueView = "public" | "mine";

export function IssuesScreen({ onOpenProfile, session }: IssuesScreenProps) {
  const [activeView, setActiveView] = useState<IssueView>("public");
  const [query, setQuery] = useState("");
  const [supportedIds, setSupportedIds] = useState<string[]>([]);
  const [sharedIds, setSharedIds] = useState<string[]>([]);
  const [confirmations, setConfirmations] = useState<Record<string, boolean>>({});
  const [issues, setIssues] = useState<PublicIssue[]>([]);
  const [statusText, setStatusText] = useState("Loading public issues from Supabase...");

  useEffect(() => {
    let isMounted = true;

    const userId = session?.user.id ?? null;
    const issueRequest = activeView === "mine" ? fetchMyIssues(userId) : fetchPublicIssues();

    Promise.all([
      issueRequest,
      fetchMySupportedIssueIds(userId),
      fetchMySharedIssueIds(userId),
      fetchMyIssueConfirmations(userId)
    ])
      .then(([nextIssues, nextSupportedIds, nextSharedIds, nextConfirmations]) => {
        if (!isMounted) {
          return;
        }

        setIssues(nextIssues);
        setSupportedIds(nextSupportedIds);
        setSharedIds(nextSharedIds);
        setConfirmations(nextConfirmations);
        setStatusText(
          getStatusText(activeView, nextIssues.length, Boolean(session))
        );
      })
      .catch((error) => {
        if (isMounted) {
          const message = error instanceof Error ? error.message : "Unable to load issues.";
          setStatusText(message);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeView, session]);

  const filteredIssues = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return issues;
    }

    return issues.filter((issue) =>
      [issue.title, issue.area, issue.summary].some((value) =>
        value.toLowerCase().includes(normalized)
      )
    );
  }, [issues, query]);

  async function handleSupport(issue: PublicIssue) {
    const alreadySupported = supportedIds.includes(issue.id);

    try {
      if (alreadySupported) {
        await removeIssueSupport(issue.id, session?.user.id ?? null);
        setSupportedIds((current) => current.filter((id) => id !== issue.id));
        setIssues((currentIssues) =>
          currentIssues.map((currentIssue) =>
            currentIssue.id === issue.id
              ? {
                  ...currentIssue,
                  supportCount: Math.max(currentIssue.supportCount - 1, 0)
                }
              : currentIssue
          )
        );
      } else {
        await supportIssue(issue.id, session?.user.id ?? null);
        setSupportedIds((current) => [...current, issue.id]);
        setIssues((currentIssues) =>
          currentIssues.map((currentIssue) =>
            currentIssue.id === issue.id
              ? { ...currentIssue, supportCount: currentIssue.supportCount + 1 }
              : currentIssue
          )
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to support issue.";
      Alert.alert("Support paused", message);
    }
  }

  async function handleShare(issue: PublicIssue) {
    if (sharedIds.includes(issue.id)) {
      Alert.alert("Already shared", "You have already shared this issue.");
      return;
    }

    const message = `${issue.title}\n${issue.area}, Pune\nCitizen report ${issue.publicId}`;

    try {
      await Share.share({ message });
      await recordIssueShare(issue.id, "native_share", session?.user.id ?? null);
      setSharedIds((current) => [...current, issue.id]);
      setIssues((currentIssues) =>
        currentIssues.map((currentIssue) =>
          currentIssue.id === issue.id
            ? { ...currentIssue, shareCount: currentIssue.shareCount + 1 }
            : currentIssue
        )
      );
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Unable to share issue.";
      Alert.alert("Share paused", messageText);
    }
  }

  async function handleConfirm(issue: PublicIssue, observed: boolean) {
    const previous = confirmations[issue.id];

    try {
      await confirmIssueObservation(issue.id, observed, session?.user.id ?? null);
      setConfirmations((current) => ({ ...current, [issue.id]: observed }));
      setIssues((currentIssues) =>
        currentIssues.map((currentIssue) => {
          if (currentIssue.id !== issue.id) {
            return currentIssue;
          }

          const confirmationCount = currentIssue.confirmationCount ?? 0;
          const notObservedCount = currentIssue.notObservedCount ?? 0;

          return {
            ...currentIssue,
            confirmationCount:
              observed && previous !== true
                ? confirmationCount + 1
                : !observed && previous === true
                  ? Math.max(confirmationCount - 1, 0)
                  : confirmationCount,
            notObservedCount:
              !observed && previous !== false
                ? notObservedCount + 1
                : observed && previous === false
                  ? Math.max(notObservedCount - 1, 0)
                  : notObservedCount
          };
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to confirm issue.";
      Alert.alert("Confirmation paused", message);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.kicker}>Top problems</Text>
      <Text style={styles.title}>
        {activeView === "public" ? "Most supported citizen issues" : "My submitted reports"}
      </Text>
      <Text style={styles.copy}>{statusText}</Text>
      <View style={styles.switcher}>
        <TouchableOpacity
          onPress={() => setActiveView("public")}
          style={[styles.switchButton, activeView === "public" && styles.switchButtonActive]}
        >
          <Text
            style={[styles.switchText, activeView === "public" && styles.switchTextActive]}
          >
            Public
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            if (!session) {
              Alert.alert("Sign in needed", "Sign in from Profile to see your reports.");
              return;
            }
            setActiveView("mine");
          }}
          style={[styles.switchButton, activeView === "mine" && styles.switchButtonActive]}
        >
          <Text style={[styles.switchText, activeView === "mine" && styles.switchTextActive]}>
            My reports
          </Text>
        </TouchableOpacity>
      </View>
      {!session && activeView === "public" ? (
        <TouchableOpacity onPress={onOpenProfile} style={styles.profileButton}>
          <Text style={styles.profileButtonText}>Sign in to see my reports</Text>
        </TouchableOpacity>
      ) : null}
      <TextInput
        onChangeText={setQuery}
        placeholder="Search Baner, signal, PMPML..."
        style={styles.search}
        value={query}
      />
      <View style={styles.list}>
        {filteredIssues.length === 0 ? (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>No issues to show</Text>
            <Text style={styles.copy}>
              {activeView === "public"
                ? "This view only shows reviewed public Supabase issues. Submitted reports remain hidden here until they are marked public."
                : "This view shows reports submitted by your signed-in account, including reports still under review."}
            </Text>
          </View>
        ) : null}
        {filteredIssues.map((issue) => {
          const supported = supportedIds.includes(issue.id);
          const shared = sharedIds.includes(issue.id);
          return (
            <IssueCard
              confirmation={confirmations[issue.id]}
              issue={issue}
              key={issue.id}
              shared={shared}
              supported={supported}
              onConfirmNotObserved={() => handleConfirm(issue, false)}
              onConfirmObserved={() => handleConfirm(issue, true)}
              onShare={() => handleShare(issue)}
              onSupport={() => handleSupport(issue)}
            />
          );
        })}
      </View>
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
  search: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 46,
    paddingHorizontal: 12
  },
  list: {
    gap: spacing.md
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22
  },
  switcher: {
    backgroundColor: colors.paleGreen,
    borderRadius: 8,
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.xs
  },
  switchButton: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    justifyContent: "center",
    minHeight: 42
  },
  switchButtonActive: {
    backgroundColor: colors.road
  },
  switchText: {
    color: colors.civic,
    fontWeight: "900"
  },
  switchTextActive: {
    color: colors.surface
  },
  profileButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderColor: colors.road,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 14
  },
  profileButtonText: {
    color: colors.road,
    fontWeight: "900"
  },
  emptyPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900"
  }
});

function getStatusText(view: IssueView, issueCount: number, signedIn: boolean) {
  if (view === "mine") {
    if (!signedIn) {
      return "Sign in from Profile to see reports you submitted.";
    }

    return issueCount > 0
      ? "Showing your submitted reports from Supabase, including reports still under review."
      : "You have not submitted any reports yet.";
  }

  return issueCount > 0
    ? "Showing reviewed public issues from Supabase."
    : "No public issues yet. Submitted reports appear here after they are reviewed and marked public.";
}
