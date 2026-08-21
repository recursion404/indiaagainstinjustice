import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { IssueCategory, LocationKind, TrafficCondition } from "@citizens-first/shared";
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
  const [category, setCategory] = useState<IssueCategory>("road_work");
  const [customCategory, setCustomCategory] = useState("");
  const [trafficCondition, setTrafficCondition] = useState<TrafficCondition>("heavy");
  const [locationKind, setLocationKind] = useState<LocationKind>("area");
  const [locationName, setLocationName] = useState("");
  const [publicSummary, setPublicSummary] = useState("");
  const [suggestedSolution, setSuggestedSolution] = useState("");
  const [pincode, setPincode] = useState("");
  const [wardNumber, setWardNumber] = useState("");
  const [photo, setPhoto] = useState<IssuePhotoDraft | null>(null);
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    session ? "Fill in the fields to submit a traffic report." : "You are submitting anonymously. Sign in from Profile to track your reports."
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
    if (!title.trim() || !area.trim()) {
      setStatusKind("error");
      setStatusMessage("Add a title and area first.");
      Alert.alert("Missing details", "Add a title and area first.");
      return;
    }

    if (!pincode.trim()) {
      setStatusKind("error");
      setStatusMessage("Pincode is mandatory.");
      Alert.alert("Missing details", "Pincode is mandatory.");
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
        customCategory: category === "other" ? customCategory : undefined,
        severity: "moderate",
        trafficCondition,
        locationKind,
        locationName,
        publicSummary,
        suggestedSolution,
        pincode,
        wardNumber,
        latitude: location?.latitude,
        longitude: location?.longitude,
        photo
      }, session?.user.id ?? null);
      setTitle("");
      setArea("");
      setCustomCategory("");
      setTrafficCondition("heavy");
      setLocationKind("area");
      setLocationName("");
      setPublicSummary("");
      setSuggestedSolution("");
      setPincode("");
      setWardNumber("");
      setPhoto(null);
      setLocation(null);
      setStatusKind("success");
      const successMessage = `Report ${submittedIssue.public_id} saved for review. It is private until an admin verifies it.`;
      setStatusMessage(successMessage);
      Alert.alert("Report Submitted", successMessage);
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

        <Text style={styles.label}>Location type</Text>
        <View style={styles.chips}>
          {(["chowk", "road", "area", "landmark"] as LocationKind[]).map((item) => {
            const selected = item === locationKind;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setLocationKind(item)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Location name</Text>
        <TextInput
          onChangeText={setLocationName}
          placeholder="Baner Radha Chowk, Wakad Bridge..."
          style={styles.input}
          value={locationName}
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

        <Text style={styles.label}>Traffic condition</Text>
        <View style={styles.chips}>
          {(["normal", "moderate", "heavy", "severe", "cleared"] as TrafficCondition[]).map((item) => {
            const selected = item === trafficCondition;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setTrafficCondition(item)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {item.replaceAll("_", " ")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {category === "other" ? (
          <>
            <Text style={styles.label}>Custom Category</Text>
            <TextInput
              onChangeText={setCustomCategory}
              placeholder="e.g. Fallen tree, street light issue..."
              style={styles.input}
              value={customCategory}
            />
          </>
        ) : null}

        <Text style={styles.label}>Public summary (Optional)</Text>
        <TextInput
          multiline
          onChangeText={setPublicSummary}
          placeholder="Describe what citizens should know publicly."
          style={[styles.input, styles.textarea]}
          textAlignVertical="top"
          value={publicSummary}
        />

        <Text style={styles.label}>Suggested solution (Optional)</Text>
        <TextInput
          multiline
          onChangeText={setSuggestedSolution}
          placeholder="Optional: change signal timing, remove illegal parking, open alternate road..."
          style={[styles.input, styles.textareaSmall]}
          textAlignVertical="top"
          value={suggestedSolution}
        />

        <Text style={styles.label}>Pincode *</Text>
        <TextInput
          keyboardType="number-pad"
          onChangeText={setPincode}
          placeholder="Enter 6-digit pincode"
          style={styles.input}
          value={pincode}
        />

        <Text style={styles.label}>Prabhag number (Optional)</Text>
        <TextInput
          onChangeText={setWardNumber}
          placeholder="Optional"
          style={styles.input}
          value={wardNumber}
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
  textareaSmall: {
    minHeight: 82,
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
