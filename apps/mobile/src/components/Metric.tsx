import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

type MetricProps = {
  label: string;
  value: string | number;
};

export function Metric({ label, value }: MetricProps) {
  return (
    <View style={styles.metric}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metric: {
    borderLeftColor: colors.signal,
    borderLeftWidth: 4,
    minWidth: 92,
    paddingLeft: 10
  },
  value: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900"
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  }
});
