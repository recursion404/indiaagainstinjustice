import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { IssuesScreen } from "./src/screens/IssuesScreen";
import { PledgeScreen } from "./src/screens/PledgeScreen";
import { PollsScreen } from "./src/screens/PollsScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { ReportScreen } from "./src/screens/ReportScreen";
import { supabase } from "./src/lib/supabase";
import { colors, spacing } from "./src/theme";

type Tab = "report" | "issues" | "polls" | "pledge" | "profile";

const tabs: Array<{ label: string; value: Tab }> = [
  { label: "Report", value: "report" },
  { label: "Issues", value: "issues" },
  { label: "Polls", value: "polls" },
  { label: "Pledge", value: "pledge" },
  { label: "Profile", value: "profile" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("report");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const screen = {
    report: <ReportScreen onOpenProfile={() => setActiveTab("profile")} session={session} />,
    issues: <IssuesScreen />,
    polls: <PollsScreen />,
    pledge: <PledgeScreen />,
    profile: <ProfileScreen onOpenReport={() => setActiveTab("report")} session={session} />
  }[activeTab];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.brand}>Citizens First Pune</Text>
        <Text style={styles.tagline}>Citizens First - Traffic First</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>{screen}</ScrollView>
      <View style={styles.tabs}>
        {tabs.map((tab) => {
          const active = activeTab === tab.value;
          return (
            <TouchableOpacity
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.paper,
    flex: 1
  },
  header: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  brand: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  tagline: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 110
  },
  tabs: {
    backgroundColor: colors.surface,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    gap: spacing.xs,
    left: 0,
    padding: spacing.sm,
    position: "absolute",
    right: 0
  },
  tab: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    justifyContent: "center",
    minHeight: 44
  },
  tabActive: {
    backgroundColor: colors.road
  },
  tabText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900"
  },
  tabTextActive: {
    color: colors.surface
  }
});
