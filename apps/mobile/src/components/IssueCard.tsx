import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { PublicIssue } from "@citizens-first/shared";
import type { IssueComment } from "../lib/issues";
import { fetchIssueComments, postIssueComment } from "../lib/issues";
import { colors, spacing } from "../theme";
import { Metric } from "./Metric";

type IssueCardProps = {
  issue: PublicIssue;
  shared: boolean;
  supported: boolean;
  confirmation?: boolean;
  session?: { user: { id: string; user_metadata?: { full_name?: string } } } | null;
  onConfirmObserved: () => void;
  onConfirmNotObserved: () => void;
  onShare: () => void;
  onSupport: () => void;
};

export function IssueCard({
  issue,
  shared,
  supported,
  confirmation,
  session,
  onConfirmObserved,
  onConfirmNotObserved,
  onShare,
  onSupport
}: IssueCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [commentCount, setCommentCount] = useState(issue.commentCount ?? 0);

  async function handleToggleComments() {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const fetched = await fetchIssueComments(issue.id);
        setComments(fetched);
      } catch {
        Alert.alert("Error", "Could not load comments.");
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  }

  async function handlePostComment() {
    if (!commentText.trim()) return;
    setIsPosting(true);
    try {
      const authorName = session?.user?.user_metadata?.full_name ?? null;
      const userId = session?.user?.id ?? null;
      const newComment = await postIssueComment(issue.id, commentText.trim(), authorName, userId);
      setComments((prev) => [...prev, newComment]);
      setCommentCount((c) => c + 1);
      setCommentText("");
    } catch {
      Alert.alert("Error", "Could not post comment. Please try again.");
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.status}>{issue.status.replaceAll("_", " ")}</Text>
        <Text style={styles.publicId}>{issue.publicId}</Text>
      </View>
      <Text style={styles.title}>{issue.title}</Text>
      <Text style={styles.area}>{issue.area}, Pune</Text>
      <Text style={styles.meta}>
        {(issue.trafficCondition ?? "heavy").replaceAll("_", " ")} traffic
      </Text>
      {issue.summary ? <Text style={styles.summary}>{issue.summary}</Text> : null}
      <View style={styles.confirmRow}>
        <Metric label="confirmed" value={issue.confirmationCount ?? 0} />
        <Metric label="not observed" value={issue.notObservedCount ?? 0} />
        <TouchableOpacity
          style={[styles.secondaryButton, confirmation === true && styles.secondaryButtonSelected]}
          onPress={onConfirmObserved}
        >
          <Text style={[styles.secondaryButtonText, confirmation === true && styles.selectedButtonText]}>
            Confirm
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, confirmation === false && styles.secondaryButtonSelected]}
          onPress={onConfirmNotObserved}
        >
          <Text style={[styles.secondaryButtonText, confirmation === false && styles.selectedButtonText]}>
            Not observed
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <Metric label="upvotes" value={issue.supportCount} />
        <Metric label="shares" value={issue.shareCount} />
        <TouchableOpacity
          style={[styles.secondaryButton, shared && styles.secondaryButtonSelected]}
          onPress={onShare}
        >
          <Text style={[styles.secondaryButtonText, shared && styles.selectedButtonText]}>
            {shared ? "Shared" : "Share"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, supported && styles.buttonSelected]}
          onPress={onSupport}
        >
          <Text style={styles.buttonText}>{supported ? "Upvoted" : "Upvote"}</Text>
        </TouchableOpacity>
      </View>

      {/* Comments toggle */}
      <TouchableOpacity style={styles.commentsToggle} onPress={handleToggleComments}>
        <Text style={styles.commentsToggleText}>
          {showComments ? "Hide comments" : `Comments (${commentCount})`}
        </Text>
      </TouchableOpacity>

      {showComments ? (
        <View style={styles.commentsSection}>
          {loadingComments ? (
            <Text style={styles.commentsLoading}>Loading comments…</Text>
          ) : comments.length === 0 ? (
            <Text style={styles.commentsLoading}>No comments yet. Be the first!</Text>
          ) : (
            comments.map((c) => (
              <View key={c.id} style={styles.commentItem}>
                <Text style={styles.commentAuthor}>{c.authorName}</Text>
                <Text style={styles.commentBody}>{c.body}</Text>
              </View>
            ))
          )}
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment…"
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              disabled={isPosting || !commentText.trim()}
              onPress={handlePostComment}
              style={[styles.commentSubmit, (isPosting || !commentText.trim()) && styles.commentSubmitDisabled]}
            >
              <Text style={styles.commentSubmitText}>{isPosting ? "…" : "Post"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  status: {
    backgroundColor: colors.paleGreen,
    borderRadius: 999,
    color: colors.civic,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
    textTransform: "uppercase"
  },
  publicId: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25
  },
  area: {
    color: colors.civic,
    fontWeight: "800"
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  summary: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.xs
  },
  confirmRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.road,
    borderRadius: 6,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 16
  },
  buttonText: {
    color: colors.surface,
    fontWeight: "900"
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.road,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 16
  },
  secondaryButtonText: {
    color: colors.road,
    fontWeight: "900"
  },
  secondaryButtonSelected: {
    backgroundColor: colors.paleGreen,
    borderColor: colors.civic
  },
  selectedButtonText: {
    color: colors.civic
  },
  buttonSelected: {
    backgroundColor: colors.civic
  },
  commentsToggle: {
    paddingVertical: 4
  },
  commentsToggleText: {
    color: colors.road,
    fontWeight: "800",
    fontSize: 13
  },
  commentsSection: {
    gap: spacing.sm
  },
  commentsLoading: {
    color: colors.muted,
    fontSize: 13
  },
  commentItem: {
    borderLeftColor: colors.line,
    borderLeftWidth: 2,
    paddingLeft: spacing.sm,
    gap: 2
  },
  commentAuthor: {
    color: colors.civic,
    fontWeight: "800",
    fontSize: 12
  },
  commentBody: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20
  },
  commentInputRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-end"
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.ink,
    fontSize: 14
  },
  commentSubmit: {
    backgroundColor: colors.road,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
    minHeight: 40
  },
  commentSubmitDisabled: {
    opacity: 0.4
  },
  commentSubmitText: {
    color: colors.surface,
    fontWeight: "900"
  }
});
