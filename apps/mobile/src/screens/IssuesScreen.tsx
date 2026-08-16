import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import type { PublicIssue } from "@citizens-first/shared";
import { IssueCard } from "../components/IssueCard";
import { sampleIssues } from "../data/sample";
import { fetchPublicIssues, supportIssue } from "../lib/issues";
import { colors, spacing } from "../theme";

export function IssuesScreen() {
  const [query, setQuery] = useState("");
  const [supportedIds, setSupportedIds] = useState<string[]>([]);
  const [issues, setIssues] = useState<PublicIssue[]>(sampleIssues);
  const [statusText, setStatusText] = useState("Showing sample issues until public reports are published.");

  useEffect(() => {
    let isMounted = true;

    fetchPublicIssues()
      .then((nextIssues) => {
        if (!isMounted) {
          return;
        }

        if (nextIssues.length > 0) {
          setIssues(nextIssues);
          setStatusText("Showing live public issues from Supabase.");
        }
      })
      .catch(() => {
        if (isMounted) {
          setStatusText("Showing sample issues while live reports are unavailable.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
    const isLiveIssue = !sampleIssues.some((sampleIssue) => sampleIssue.id === issue.id);

    if (!isLiveIssue) {
      setSupportedIds((current) =>
        current.includes(issue.id)
          ? current.filter((id) => id !== issue.id)
          : [...current, issue.id]
      );
      return;
    }

    try {
      await supportIssue(issue.id);
      setSupportedIds((current) => [...current, issue.id]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to support issue.";
      Alert.alert("Support paused", message);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.kicker}>Top problems</Text>
      <Text style={styles.title}>Most supported citizen issues</Text>
      <Text style={styles.copy}>{statusText}</Text>
      <TextInput
        onChangeText={setQuery}
        placeholder="Search Baner, signal, PMPML..."
        style={styles.search}
        value={query}
      />
      <View style={styles.list}>
        {filteredIssues.map((issue) => {
          const supported = supportedIds.includes(issue.id);
          return (
            <IssueCard
              issue={{
                ...issue,
                supportCount: issue.supportCount + (supported ? 1 : 0)
              }}
              key={issue.id}
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
  }
});
