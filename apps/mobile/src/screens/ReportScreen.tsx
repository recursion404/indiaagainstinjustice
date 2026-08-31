import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { LocationKind, TrafficCondition, CivicCategory } from "@citizens-first/shared";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { IssuePhotoDraft } from "../lib/issues";
import { submitTrafficIssue } from "../lib/issues";
import { colors, spacing } from "../theme";

type ReportScreenProps = {
  onOpenProfile: () => void;
  session: Session | null;
};

const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

export function ReportScreen({ onOpenProfile, session }: ReportScreenProps) {
  const [title, setTitle] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [townVillage, setTownVillage] = useState("");
  const [category, setCategory] = useState("traffic");
  const [categoriesList, setCategoriesList] = useState<CivicCategory[]>([]);
  const [customCategory, setCustomCategory] = useState("");
  const [trafficCondition, setTrafficCondition] = useState<TrafficCondition>("heavy");
  const [locationKind, setLocationKind] = useState<LocationKind>("area");
  const [locationName, setLocationName] = useState("");
  const [publicSummary, setPublicSummary] = useState("");
  const [suggestedSolution, setSuggestedSolution] = useState("");
  const [pincode, setPincode] = useState("");
  const [photo, setPhoto] = useState<IssuePhotoDraft | null>(null);
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    session ? "Fill in the fields to submit a civic report." : "You are submitting anonymously. Sign in from Profile to track your reports."
  );
  const [statusKind, setStatusKind] = useState<"info" | "success" | "error">("info");

  function setSelectedPhoto(asset: ImagePicker.ImagePickerAsset) {
    if (asset.fileSize && asset.fileSize > PHOTO_MAX_BYTES) {
      const message = "Each image must be 10 MB or smaller.";
      setStatusKind("error");
      setStatusMessage(message);
      Alert.alert("Image too large", message);
      return;
    }

    setPhoto({
      uri: asset.uri,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      fileSize: asset.fileSize
    });
  }

  useEffect(() => {
    async function loadCategories() {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .eq("is_active", true)
          .order("label", { ascending: true });
        
        if (!error && data) {
          setCategoriesList(data.map(c => ({
            slug: c.slug,
            label: c.label,
            icon: c.icon,
            isActive: c.is_active
          })));
        }
      } catch (err) {
        console.warn("Failed to load dynamic categories:", err);
      }
    }
    loadCategories();
  }, []);

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
      setSelectedPhoto(result.assets[0]);
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
      setSelectedPhoto(result.assets[0]);
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
    if (!title.trim() || !state.trim() || !townVillage.trim()) {
      setStatusKind("error");
      setStatusMessage("Title, State, and Town/Village are mandatory fields.");
      Alert.alert("Missing details", "Title, State, and Town/Village are mandatory fields.");
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
        category,
        customCategory: category === "other" ? customCategory : undefined,
        state,
        district: district || undefined,
        townVillage,
        pincode,
        publicSummary,
        locationName,
        photo
      }, session?.user.id ?? null);
      setTitle("");
      setState("");
      setDistrict("");
      setTownVillage("");
      setCustomCategory("");
      setTrafficCondition("heavy");
      setLocationKind("area");
      setLocationName("");
      setPublicSummary("");
      setSuggestedSolution("");
      setPincode("");
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
      <Text style={styles.kicker}>Public Interest Report</Text>
      <Text style={styles.title}>Report an Injustice / Issue</Text>

      <View style={styles.panel}>
        <View style={[styles.notice, styles[statusKind]]}>
          <Text style={styles.noticeText}>{statusMessage}</Text>
          {!session ? (
            <TouchableOpacity onPress={onOpenProfile} style={styles.noticeButton}>
              <Text style={styles.noticeButtonText}>Open Profile</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.label}>Issue Title / Summary *</Text>
        <TextInput
          onChangeText={setTitle}
          placeholder="e.g. Unfinished road bridge causing severe safety hazard"
          style={styles.input}
          value={title}
        />

        <Text style={styles.label}>Select Category / Topic *</Text>
        <View style={styles.chips}>
          {(categoriesList.length > 0 ? categoriesList : [
            { slug: "traffic", label: "Traffic & Safety" },
            { slug: "infrastructure", label: "Infrastructure & Roads" },
            { slug: "garbage", label: "Garbage & Sanitation" },
            { slug: "corruption", label: "Corruption & Bribes" }
          ]).map((item) => {
            const selected = item.slug === category;
            return (
              <TouchableOpacity
                key={item.slug}
                onPress={() => setCategory(item.slug)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {category === "other" ? (
          <>
            <Text style={styles.label}>Custom Topic Description</Text>
            <TextInput
              onChangeText={setCustomCategory}
              placeholder="Describe this topic"
              style={styles.input}
              value={customCategory}
            />
          </>
        ) : null}

        <Text style={styles.label}>State *</Text>
        <TextInput
          onChangeText={setState}
          placeholder="e.g. Maharashtra, Karnataka, Delhi..."
          style={styles.input}
          value={state}
        />

        <Text style={styles.label}>District (Optional)</Text>
        <TextInput
          onChangeText={setDistrict}
          placeholder="e.g. Pune, Mumbai, Bangalore..."
          style={styles.input}
          value={district}
        />

        <Text style={styles.label}>Town / Village / Ward *</Text>
        <TextInput
          onChangeText={setTownVillage}
          placeholder="e.g. Baner, Wakad, Indiranagar..."
          style={styles.input}
          value={townVillage}
        />

        <Text style={styles.label}>Pincode *</Text>
        <TextInput
          keyboardType="number-pad"
          onChangeText={setPincode}
          placeholder="Enter 6-digit postal pincode"
          style={styles.input}
          value={pincode}
        />

        <Text style={styles.label}>Detailed Description / Notes (Optional)</Text>
        <TextInput
          multiline
          onChangeText={setPublicSummary}
          placeholder="Provide any additional details or evidence notes..."
          style={[styles.input, styles.textarea]}
          textAlignVertical="top"
          value={publicSummary}
        />

        <Text style={styles.label}>Specific Landmark / Road (Optional)</Text>
        <TextInput
          onChangeText={setLocationName}
          placeholder="e.g. Near Indiranagar Metro Station"
          style={styles.input}
          value={locationName}
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

        <Text style={styles.helperText}>Photo evidence must be 10 MB or smaller. Mobile currently supports one image per report.</Text>
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
    gap: spacing.lg
  },
  kicker: {
    color: "#FF671F", // Saffron Accent
    fontWeight: "900",
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 1.5,
    marginBottom: -4
  },
  title: {
    color: "#0B1F4B", // Navy Ink
    fontSize: 32,
    fontWeight: "950",
    lineHeight: 38,
    letterSpacing: -0.5
  },
  copy: {
    color: "#41516F", // Muted Navy
    fontSize: 15,
    lineHeight: 22
  },
  panel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F1F5F9",
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2
  },
  label: {
    color: "#41516F",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: -spacing.xs
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    color: "#0B1F4B",
    minHeight: 48,
    paddingHorizontal: 16,
    fontSize: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1
  },
  textarea: {
    minHeight: 112,
    paddingTop: 12,
    paddingBottom: 12
  },
  textareaSmall: {
    minHeight: 82,
    paddingTop: 12,
    paddingBottom: 12
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 4
  },
  chip: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 0.5
  },
  chipSelected: {
    backgroundColor: "#0B1F4B",
    borderColor: "#0B1F4B"
  },
  chipText: {
    color: "#475569",
    fontWeight: "700",
    fontSize: 13
  },
  chipTextSelected: {
    color: "#FFFFFF"
  },
  button: {
    alignItems: "center",
    backgroundColor: "#FF671F", // Saffron primary button
    borderRadius: 14,
    justifyContent: "center",
    marginTop: spacing.sm,
    minHeight: 52,
    shadowColor: "#FF671F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16
  },
  mediaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF"
  },
  secondaryButtonText: {
    color: "#0B1F4B",
    fontWeight: "700",
    fontSize: 13
  },
  helperText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18
  },
  preview: {
    aspectRatio: 16 / 10,
    borderRadius: 14,
    width: "100%"
  },
  notice: {
    borderRadius: 16,
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  info: {
    backgroundColor: "#F8FAFC"
  },
  success: {
    backgroundColor: "#E7F4EB"
  },
  error: {
    backgroundColor: "#FDE7E0"
  },
  noticeText: {
    color: "#0B1F4B",
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 20
  },
  noticeButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#0B1F4B",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 14
  },
  noticeButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13
  }
});
