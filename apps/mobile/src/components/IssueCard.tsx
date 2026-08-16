import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { PublicIssue } from "@citizens-first/shared";
import { colors, spacing } from "../theme";
import { Metric } from "./Metric";

type IssueCardProps = {
  issue: PublicIssue;
  onSupport: () => void;
};

export function IssueCard({ issue, onSupport }: IssueCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.status}>{issue.status.replaceAll("_", " ")}</Text>
        <Text style={styles.publicId}>{issue.publicId}</Text>
      </View>
      <Text style={styles.title}>{issue.title}</Text>
      <Text style={styles.area}>{issue.area}, Pune</Text>
      <Text style={styles.summary}>{issue.summary}</Text>
      <View style={styles.footer}>
        <Metric label="supports" value={issue.supportCount} />
        <Metric label="shares" value={issue.shareCount} />
        <TouchableOpacity style={styles.button} onPress={onSupport}>
          <Text style={styles.buttonText}>Support</Text>
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
  }
});
