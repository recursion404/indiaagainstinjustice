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
    backgroundColor: "#FFFFFF",
    borderColor: "#F1F5F9",
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: spacing.sm
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  status: {
    backgroundColor: "#E7F4EB",
    borderRadius: 9999,
    color: "#138A36",
    fontSize: 10,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
    textTransform: "uppercase"
  },
  publicId: {
    color: "#41516F",
    fontSize: 11,
    fontWeight: "700"
  },
  title: {
    color: "#0B1F4B",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 23,
    letterSpacing: -0.3
  },
  area: {
    color: "#FF671F", // Saffron Accent
    fontWeight: "700",
    fontSize: 13
  },
  meta: {
    color: "#41516F",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  summary: {
    color: "#41516F",
    fontSize: 14,
    lineHeight: 20
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: spacing.xs
  },
  confirmRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderTopColor: "#F1F5F9",
    borderTopWidth: 1,
    paddingTop: spacing.xs
  },
  button: {
    alignItems: "center",
    backgroundColor: "#FF671F", // Saffron upvote
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 14
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#E2E8F0",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF"
  },
  secondaryButtonText: {
    color: "#0B1F4B",
    fontWeight: "700",
    fontSize: 13
  },
  secondaryButtonSelected: {
    backgroundColor: "#E2E8F0",
    borderColor: "#CBD5E1"
  },
  selectedButtonText: {
    color: "#0B1F4B"
  },
  buttonSelected: {
    backgroundColor: "#138A36",
    borderColor: "#138A36"
  },
  commentsToggle: {
    paddingVertical: 6,
    borderTopColor: "#F1F5F9",
    borderTopWidth: 1,
    marginTop: 4
  },
  commentsToggleText: {
    color: "#0B1F4B",
    fontWeight: "700",
    fontSize: 13
  },
  commentsSection: {
    gap: spacing.sm,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: spacing.sm,
    marginTop: 2
  },
  commentsLoading: {
    color: "#41516F",
    fontSize: 12,
    fontStyle: "italic"
  },
  commentItem: {
    borderLeftColor: "#E2E8F0",
    borderLeftWidth: 3,
    paddingLeft: spacing.sm,
    gap: 2,
    marginBottom: 4
  },
  commentAuthor: {
    color: "#0B1F4B",
    fontWeight: "700",
    fontSize: 12
  },
  commentBody: {
    color: "#41516F",
    fontSize: 13,
    lineHeight: 18
  },
  commentInputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
    marginTop: 4
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#0B1F4B",
    fontSize: 13
  },
  commentSubmit: {
    backgroundColor: "#0B1F4B",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
    minHeight: 38
  },
  commentSubmitDisabled: {
    opacity: 0.4
  },
  commentSubmitText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13
  }
});
