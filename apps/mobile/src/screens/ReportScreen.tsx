import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { IssueCategory } from "@citizens-first/shared";
import type { Session } from "@supabase/supabase-js";
import { quickCategories } from "../data/sample";
import type { IssuePhotoDraft } from "../lib/issues";
import { submitTrafficIssue } from "../lib/issues";
import { colors, spacing } from "../theme";

type ReportScreenProps = {
  onOpenProfile: () => void;
  session: Session | null;
};

export function ReportScreen({ onOpenProfile, session }: ReportScreenProps) {
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [category, setCategory] = useState<IssueCategory>("traffic_jam");
  const [publicSummary, setPublicSummary] = useState("");
  const [privateAddress, setPrivateAddress] = useState("");
  const [photo, setPhoto] = useState<IssuePhotoDraft | null>(null);
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "Sign in from Profile before submitting a real report."
  );
  const [statusKind, setStatusKind] = useState<"info" | "success" | "error">("info");

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access to attach issue photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.75,
      allowsEditing: false
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setPhoto({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType
      });
    }
  }

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow camera access to capture issue photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.75,
      allowsEditing: false
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setPhoto({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType
      });
    }
  }

  async function handleUseLocation() {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow location access to attach the report point.");
      return;
    }

    const currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });
    setLocation(currentLocation.coords);
  }

  async function handleSubmit() {
    if (!title.trim() || !area.trim() || !publicSummary.trim()) {
      setStatusKind("error");
      setStatusMessage("Add a title, area and public summary first.");
      Alert.alert("Missing details", "Add a title, area and public summary first.");
      return;
    }

    if (!session) {
      setStatusKind("error");
      setStatusMessage("Please sign in from Profile before submitting a report.");
      return;
    }

    setIsSubmitting(true);
    setStatusKind("info");
    setStatusMessage("Submitting report to Supabase...");
    try {
      const submittedIssue = await submitTrafficIssue({
        title,
        area,
        category,
        publicSummary,
        privateAddress,
        latitude: location?.latitude,
        longitude: location?.longitude,
        photo
      }, session.user.id);
      setTitle("");
      setArea("");
      setPublicSummary("");
      setPrivateAddress("");
      setPhoto(null);
      setLocation(null);
      setStatusKind("success");
      setStatusMessage(`Report ${submittedIssue.public_id} saved for review.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit report.";
      setStatusKind("error");
      setStatusMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.kicker}>Citizen report</Text>
      <Text style={styles.title}>Report a Pune traffic problem</Text>
      <Text style={styles.copy}>
        Keep the public summary factual. Private address details are stored separately
        and should not appear on SEO pages.
      </Text>

      <View style={styles.panel}>
        <View style={[styles.notice, styles[statusKind]]}>
          <Text style={styles.noticeText}>{statusMessage}</Text>
          {!session ? (
            <TouchableOpacity onPress={onOpenProfile} style={styles.noticeButton}>
              <Text style={styles.noticeButtonText}>Open Profile</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.label}>Problem title</Text>
        <TextInput
          onChangeText={setTitle}
          placeholder="Heavy traffic near Baner main road"
          style={styles.input}
          value={title}
        />

        <Text style={styles.label}>Area</Text>
        <TextInput
          onChangeText={setArea}
          placeholder="Baner, Wakad, Hinjewadi..."
          style={styles.input}
          value={area}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>
          {quickCategories.map((item) => {
            const selected = item.value === category;
            return (
              <TouchableOpacity
                key={item.value}
                onPress={() => setCategory(item.value)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Public summary</Text>
        <TextInput
          multiline
          onChangeText={setPublicSummary}
          placeholder="Describe what citizens should know publicly."
          style={[styles.input, styles.textarea]}
          textAlignVertical="top"
          value={publicSummary}
        />

        <Text style={styles.label}>Private address or landmark</Text>
        <TextInput
          onChangeText={setPrivateAddress}
          placeholder="Optional, not shown publicly"
          style={styles.input}
          value={privateAddress}
        />

        <View style={styles.mediaRow}>
          <TouchableOpacity onPress={handleTakePhoto} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Take photo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickPhoto} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>
              {photo ? "Change photo" : "Choose photo"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleUseLocation} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>
              {location ? "Location added" : "Use location"}
            </Text>
          </TouchableOpacity>
        </View>

        {photo ? <Image source={{ uri: photo.uri }} style={styles.preview} /> : null}

        <TouchableOpacity
          disabled={isSubmitting}
          onPress={handleSubmit}
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? "Submitting..." : "Submit report"}
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
    fontSize: 36,
    fontWeight: "900",
    lineHeight: 40
  },
  copy: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  label: {
    color: colors.muted,
    fontWeight: "800"
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 6,
    borderWidth: 1,
    color: colors.ink,
    minHeight: 46,
    paddingHorizontal: 12
  },
  textarea: {
    minHeight: 112,
    paddingTop: 12
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  chip: {
    backgroundColor: colors.paleGreen,
    borderColor: colors.paleGreen,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8
  },
  chipSelected: {
    backgroundColor: colors.road,
    borderColor: colors.road
  },
  chipText: {
    color: colors.civic,
    fontWeight: "900"
  },
  chipTextSelected: {
    color: colors.surface
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.road,
    borderRadius: 6,
    justifyContent: "center",
    marginTop: spacing.xs,
    minHeight: 48
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: colors.surface,
    fontWeight: "900"
  },
  mediaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.road,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 14
  },
  secondaryButtonText: {
    color: colors.road,
    fontWeight: "900"
  },
  preview: {
    aspectRatio: 16 / 10,
    borderRadius: 8,
    width: "100%"
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
    backgroundColor: "#dff3e6"
  },
  error: {
    backgroundColor: "#f8e3df"
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
  }
});
