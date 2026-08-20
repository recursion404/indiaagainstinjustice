import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { PublicIssue } from "@citizens-first/shared";
import type { Session } from "@supabase/supabase-js";
import { signInCitizen, signOutCitizen, signUpCitizen } from "../lib/auth";
import { fetchMyIssues } from "../lib/issues";
import { colors, spacing } from "../theme";

type ProfileScreenProps = {
  onOpenReport: () => void;
  session: Session | null;
};

export function ProfileScreen({ onOpenReport, session }: ProfileScreenProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [myIssues, setMyIssues] = useState<PublicIssue[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [statusKind, setStatusKind] = useState<"info" | "success" | "error">("info");
  const [statusMessage, setStatusMessage] = useState(
    "Step 1: create an account or sign in. Step 2: submit a traffic report."
  );

  function switchMode(nextMode: "signin" | "signup") {
    setMode(nextMode);
    setStatusKind("info");
    setStatusMessage(
      nextMode === "signup"
        ? "Create your citizen account first. Full name, email and password are required."
        : "Sign in with your existing account before reporting an issue."
    );
  }

  useEffect(() => {
    if (!session) {
      setMyIssues([]);
      return;
    }

    let isMounted = true;
    setIsLoadingIssues(true);

    fetchMyIssues(session.user.id)
      .then((issues) => {
        if (isMounted) {
          setMyIssues(issues);
        }
      })
      .catch((error) => {
        if (isMounted) {
          const message = error instanceof Error ? error.message : "Unable to load reports.";
          setStatusKind("error");
          setStatusMessage(message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingIssues(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session]);

  async function handleAuth() {
    if (mode === "signup" && !fullName.trim()) {
      setStatusKind("error");
      setStatusMessage("Full name is required to create your citizen profile.");
      return;
    }

    if (!email.trim()) {
      setStatusKind("error");
      setStatusMessage("Email address is required.");
      return;
    }

    if (!password.trim()) {
      setStatusKind("error");
      setStatusMessage("Password is required.");
      return;
    }

    if (password.length < 6) {
      setStatusKind("error");
      setStatusMessage("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    setStatusKind("info");
    setStatusMessage(mode === "signup" ? "Creating your account..." : "Signing you in...");
    try {
      if (mode === "signup") {
        const result = await signUpCitizen({ email, password, fullName });
        if (!result.session) {
          setStatusKind("success");
          setStatusMessage(
            "Account created. Check your email to confirm it, then come back and sign in."
          );
          setMode("signin");
        } else {
          setStatusKind("success");
          setStatusMessage("Account created and signed in. You can submit a report now.");
        }
      } else {
        await signInCitizen(email, password);
        setStatusKind("success");
        setStatusMessage("Signed in. You can submit a report now.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to continue.";
      setStatusKind("error");
      setStatusMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignOut() {
    setIsLoading(true);
    setStatusKind("info");
    setStatusMessage("Signing out...");
    try {
      await signOutCitizen();
      setStatusKind("success");
      setStatusMessage("Signed out. Sign in again before submitting reports.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign out.";
      setStatusKind("error");
      setStatusMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  if (session) {
    return (
      <View style={styles.screen}>
        <Text style={styles.kicker}>Profile</Text>
        <Text style={styles.title}>Citizen account</Text>
        <View style={styles.panel}>
          <Text style={styles.copy}>Signed in as {session.user.email}</Text>
          <Text style={styles.copy}>
            Reports, supports, votes and pledges can now be connected to this citizen
            account.
          </Text>
          <TouchableOpacity onPress={onOpenReport} style={styles.button}>
            <Text style={styles.buttonText}>Report an issue</Text>
          </TouchableOpacity>
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>My reports</Text>
          {isLoadingIssues ? <Text style={styles.copy}>Loading your reports...</Text> : null}
          {!isLoadingIssues && myIssues.length === 0 ? (
            <Text style={styles.copy}>
              No reports submitted yet. Submit your first issue from the Report tab.
            </Text>
          ) : null}
          {myIssues.map((issue) => (
            <View key={issue.id} style={styles.issueRow}>
              <Text style={styles.issueTitle}>{issue.title}</Text>
              <Text style={styles.issueMeta}>
                {issue.publicId} | {issue.area}, Pune
              </Text>
              <Text style={styles.issueStatus}>{issue.status.replaceAll("_", " ")}</Text>
            </View>
          ))}
          <TouchableOpacity
            disabled={isLoading}
            onPress={handleSignOut}
            style={[styles.button, styles.outlineButton]}
          >
            <Text style={styles.outlineButtonText}>
              {isLoading ? "Signing out..." : "Sign out"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.kicker}>Profile</Text>
      <Text style={styles.title}>Citizen account</Text>
      <View style={styles.panel}>
        <Text style={styles.copy}>
          Create an account or sign in before submitting traffic reports with photos.
        </Text>
        <View style={[styles.notice, styles[statusKind]]}>
          <Text style={styles.noticeText}>{statusMessage}</Text>
        </View>
        <View style={styles.switcher}>
          <TouchableOpacity
            onPress={() => switchMode("signin")}
            style={[styles.switchButton, mode === "signin" && styles.switchButtonActive]}
          >
            <Text style={[styles.switchText, mode === "signin" && styles.switchTextActive]}>
              Sign in
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => switchMode("signup")}
            style={[styles.switchButton, mode === "signup" && styles.switchButtonActive]}
          >
            <Text style={[styles.switchText, mode === "signup" && styles.switchTextActive]}>
              Sign up
            </Text>
          </TouchableOpacity>
        </View>

        {mode === "signup" ? (
          <View style={styles.field}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              onChangeText={setFullName}
              placeholder="Example: Ganesh Pawar"
              style={styles.input}
              value={fullName}
            />
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            style={styles.input}
            value={email}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            onChangeText={setPassword}
            placeholder="Minimum 6 characters"
            secureTextEntry
            style={styles.input}
            value={password}
          />
        </View>
        <TouchableOpacity disabled={isLoading} onPress={handleAuth} style={styles.button}>
          <Text style={styles.buttonText}>
            {isLoading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
          </Text>
        </TouchableOpacity>
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
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  copy: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24
  },
  notice: {
    borderRadius: 8,
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
  field: {
    gap: spacing.xs
  },
  label: {
    color: colors.muted,
    fontWeight: "800"
  },
  sectionDivider: {
    backgroundColor: colors.line,
    height: 1
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900"
  },
  issueRow: {
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  issueTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  issueMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  issueStatus: {
    alignSelf: "flex-start",
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
  button: {
    alignItems: "center",
    backgroundColor: colors.road,
    borderRadius: 6,
    justifyContent: "center",
    minHeight: 48
  },
  buttonText: {
    color: colors.surface,
    fontWeight: "900"
  },
  outlineButton: {
    backgroundColor: colors.surface,
    borderColor: colors.road,
    borderWidth: 1
  },
  outlineButtonText: {
    color: colors.road,
    fontWeight: "900"
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 46,
    paddingHorizontal: 12
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
    minHeight: 40,
    justifyContent: "center"
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
  }
});
