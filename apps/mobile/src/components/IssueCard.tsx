import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { PublicIssue } from "@citizens-first/shared";
import { colors, spacing } from "../theme";
import { Metric } from "./Metric";

type IssueCardProps = {
  issue: PublicIssue;
  shared: boolean;
  supported: boolean;
  confirmation?: boolean;
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
  onConfirmObserved,
  onConfirmNotObserved,
  onShare,
  onSupport
}: IssueCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.status}>{issue.status.replaceAll("_", " ")}</Text>
        <Text style={styles.publicId}>{issue.publicId}</Text>
      </View>
      <Text style={styles.title}>{issue.title}</Text>
      <Text style={styles.area}>{issue.area}, Pune</Text>
      <Text style={styles.meta}>
        {(issue.trafficCondition ?? "heavy").replaceAll("_", " ")} traffic | {issue.severity ?? "moderate"} severity
      </Text>
      <Text style={styles.summary}>{issue.summary}</Text>
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
        <Metric label="supports" value={issue.supportCount} />
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
          <Text style={styles.buttonText}>{supported ? "Supported" : "Support"}</Text>
        </TouchableOpacity>
      </View>
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
  }
});
