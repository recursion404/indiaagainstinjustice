"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { CivicCategory } from "@citizens-first/shared";
import { Camera, MapPin, Send, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge, Button, Card, Field, Notice, PageShell, SectionHeader, cn, inputClassName } from "@/components/ui";

const INDIAN_STATES_DISTRICTS: Record<string, string[]> = {
  Maharashtra: ["Pune", "Mumbai City", "Mumbai Suburban", "Thane", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Amravati", "Kolhapur"],
  Karnataka: ["Bangalore Urban", "Bangalore Rural", "Mysore", "Belgaum", "Mangalore", "Hubli-Dharwad", "Tumkur", "Gulbarga"],
  Delhi: ["Central Delhi", "New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Tirunelveli", "Vellore"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Ghaziabad", "Agra", "Varanasi", "Allahabad", "Meerut"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar"],
  Telangana: ["Hyderabad", "Ranga Reddy", "Warangal", "Nizamabad", "Karimnagar"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Hooghly", "North 24 Parganas", "South 24 Parganas"],
  Kerala: ["Trivandrum", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kannur"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"]
};

const REPORT_LIMITS = {
  titleMin: 10,
  titleMax: 120,
  customCategoryMin: 3,
  customCategoryMax: 60,
  townVillageMin: 2,
  townVillageMax: 80,
  locationNameMax: 120,
  summaryMax: 1200,
  photoMaxBytes: 10 * 1024 * 1024,
  photoMaxCount: 2
};

const allowedPhotoTypes = ["image/jpeg", "image/png", "image/webp"];

export default function ReportPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<"simple" | "detailed">("simple");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("traffic");
  const [categoriesList, setCategoriesList] = useState<CivicCategory[]>([]);
  const [customCategory, setCustomCategory] = useState("");
  const [locationName, setLocationName] = useState("");
  const [state, setState] = useState("Maharashtra");
  const [district, setDistrict] = useState("Pune");
  const [townVillage, setTownVillage] = useState("");
  const [summary, setSummary] = useState("");
  const [pincode, setPincode] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function clearError(field: string) {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function setFieldValue(field: string, valueSetter: (value: string) => void, value: string) {
    valueSetter(value);
    clearError(field);
  }

  function getPhotoValidationError(nextPhotos: File[]) {
    if (nextPhotos.length > REPORT_LIMITS.photoMaxCount) {
      return `Attach no more than ${REPORT_LIMITS.photoMaxCount} images.`;
    }

    if (nextPhotos.some((item) => !allowedPhotoTypes.includes(item.type))) {
      return "Upload only JPG, PNG, or WebP images.";
    }

    if (nextPhotos.some((item) => item.size > REPORT_LIMITS.photoMaxBytes)) {
      return "Each image must be 10 MB or smaller.";
    }

    return "";
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));

    async function loadCategories() {
      try {
        const { data, error } = await supabase.from("categories").select("*").eq("is_active", true).order("label", { ascending: true });
        if (!error && data) {
          setCategoriesList(data.map((c) => ({ slug: c.slug, label: c.label, icon: c.icon, isActive: c.is_active })));
        }
      } catch (error) {
        console.warn("Failed to load categories:", error);
      }
    }

    void loadCategories();
    return () => listener.subscription.unsubscribe();
  }, []);

  function useLocation() {
    if (!navigator.geolocation) {
      setMessage("Location is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setMessage("Location attached. It will remain private until an admin approves public details.");
      },
      () => setMessage("Location permission was not granted.")
    );
  }

  async function submitReport() {
    const newErrors: Record<string, string> = {};
    const trimmedTitle = title.trim();
    const trimmedCustomCategory = customCategory.trim();
    const trimmedTownVillage = townVillage.trim();
    const trimmedLocationName = locationName.trim();
    const trimmedSummary = summary.trim();
    const trimmedPincode = pincode.trim();

    if (!trimmedTitle) newErrors.title = "Add a short title so people can understand the issue quickly.";
    else if (trimmedTitle.length < REPORT_LIMITS.titleMin) newErrors.title = `Title must be at least ${REPORT_LIMITS.titleMin} characters.`;
    else if (trimmedTitle.length > REPORT_LIMITS.titleMax) newErrors.title = `Title must be ${REPORT_LIMITS.titleMax} characters or fewer.`;

    if (!state.trim()) newErrors.state = "State is required.";
    if (!trimmedTownVillage) newErrors.townVillage = "Add the town, village, area, or ward where this issue exists.";
    else if (trimmedTownVillage.length < REPORT_LIMITS.townVillageMin) newErrors.townVillage = `Location name must be at least ${REPORT_LIMITS.townVillageMin} characters.`;
    else if (trimmedTownVillage.length > REPORT_LIMITS.townVillageMax) newErrors.townVillage = `Location name must be ${REPORT_LIMITS.townVillageMax} characters or fewer.`;

    if (!trimmedPincode) newErrors.pincode = "Enter the 6-digit pincode for this area.";
    else if (!/^\d{6}$/.test(trimmedPincode)) newErrors.pincode = "Pincode must contain exactly 6 digits.";

    if (category === "other") {
      if (!trimmedCustomCategory) newErrors.customCategory = "Describe the issue category in a few words.";
      else if (trimmedCustomCategory.length < REPORT_LIMITS.customCategoryMin) newErrors.customCategory = `Category must be at least ${REPORT_LIMITS.customCategoryMin} characters.`;
      else if (trimmedCustomCategory.length > REPORT_LIMITS.customCategoryMax) newErrors.customCategory = `Category must be ${REPORT_LIMITS.customCategoryMax} characters or fewer.`;
    }

    if (trimmedLocationName.length > REPORT_LIMITS.locationNameMax) newErrors.locationName = `Landmark must be ${REPORT_LIMITS.locationNameMax} characters or fewer.`;
    if (trimmedSummary.length > REPORT_LIMITS.summaryMax) newErrors.summary = `Description must be ${REPORT_LIMITS.summaryMax} characters or fewer.`;
    const photoError = getPhotoValidationError(photos);
    if (photoError) newErrors.photo = photoError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setMessage("Please fix the highlighted fields before submitting.");
      return;
    }

    setErrors({});
    setBusy(true);

    try {
      const { data: reportId, error } = await supabase.rpc("submit_report_rpc", {
        p_reporter_name: "Citizen",
        p_reporter_mobile: "",
        p_category: category,
        p_subcategory: category === "other" ? trimmedCustomCategory : null,
        p_summary: trimmedTitle,
        p_description: trimmedSummary || "",
        p_state: state.trim(),
        p_district: district.trim() || null,
        p_town_village: trimmedTownVillage,
        p_pincode: trimmedPincode,
        p_photo_url: null,
        p_video_url: null,
        p_additional_location_detail: trimmedLocationName || null
      });

      if (error) throw error;

      const reportUUID = reportId as string;
      const publicId = `IAI-${reportUUID.substring(0, 8)}`;

      if (photos.length > 0) {
        const storageBucket = session?.user.id ?? "anonymous";
        for (const [index, photo] of photos.entries()) {
          const storagePath = `${storageBucket}/${reportUUID}/${Date.now()}-${index}-${photo.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
          const upload = await supabase.storage.from("issue-photos").upload(storagePath, photo, { contentType: photo.type || "image/jpeg" });
          if (upload.error) throw upload.error;
          const photoInsert = await supabase.from("issue_photos").insert({ issue_id: reportUUID, storage_path: storagePath, alt_text: `Evidence photo ${index + 1} for ${publicId}`, is_public: false });
          if (photoInsert.error) throw photoInsert.error;
        }
      }

      const successMessage = `Report ${publicId} submitted for review. It is private until an admin verifies it.`;
      setMessage(successMessage);
      setTitle("");
      setState("Maharashtra");
      setDistrict("Pune");
      setTownVillage("");
      setSummary("");
      setPhotos([]);
      setCoordinates(null);
      setLocationName("");
      setPincode("");
      setCustomCategory("");
      setCategory("traffic");
      setMode("simple");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell className="max-w-5xl">
      <SectionHeader
        eyebrow={<Badge><ShieldCheck size={12} /> Private before review</Badge>}
        title="Submit a civic issue report"
        description="Submit a simple or detailed report. Private citizen details, location precision, and media stay hidden until an administrator approves what can safely become public."
      />

      <Card className="space-y-8 p-8 sm:p-10">
        {session ? <Notice tone="muted">Signed in as {session.user.email}</Notice> : null}

        <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1">
          <Button variant={mode === "simple" ? "primary" : "ghost"} onClick={() => setMode("simple")} className="shadow-none">Simple report</Button>
          <Button variant={mode === "detailed" ? "primary" : "ghost"} onClick={() => setMode("detailed")} className="shadow-none">Detailed report</Button>
        </div>

        <div className="space-y-6">
          <h2 className="border-b border-border pb-3 text-lg font-semibold text-foreground">1. Issue information</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Issue Title / Summary *" error={errors.title} className="md:col-span-2">
              <input
                aria-invalid={Boolean(errors.title)}
                className={cn(inputClassName, errors.title && "border-destructive focus-visible:ring-destructive/20")}
                maxLength={REPORT_LIMITS.titleMax}
                value={title}
                onChange={(event) => setFieldValue("title", setTitle, event.target.value)}
                placeholder="e.g. Unfinished road bridge causing safety risk"
              />
              <span className="text-xs font-bold text-muted-foreground">{title.trim().length}/{REPORT_LIMITS.titleMax} characters</span>
            </Field>

            <Field label="Category / Topic *">
              <select className={inputClassName} value={category} onChange={(event) => setCategory(event.target.value)}>
                {(categoriesList.length > 0 ? categoriesList : [
                  { slug: "traffic", label: "Traffic & Road Safety" },
                  { slug: "infrastructure", label: "Infrastructure & Roads" },
                  { slug: "garbage", label: "Garbage & Sanitation" },
                  { slug: "corruption", label: "Corruption & Bribes" },
                  { slug: "other", label: "Other Civic Issue" }
                ]).map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}
              </select>
            </Field>

            {category === "other" ? (
              <Field label="Describe category *" error={errors.customCategory}>
                <input
                  aria-invalid={Boolean(errors.customCategory)}
                  className={cn(inputClassName, errors.customCategory && "border-destructive focus-visible:ring-destructive/20")}
                  maxLength={REPORT_LIMITS.customCategoryMax}
                  value={customCategory}
                  onChange={(event) => setFieldValue("customCategory", setCustomCategory, event.target.value)}
                  placeholder="Describe this topic"
                />
              </Field>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="border-b border-border pb-3 text-lg font-semibold text-foreground">2. Location details</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="State *" error={errors.state}>
              <select className={inputClassName} value={state} onChange={(event) => {
                const selectedState = event.target.value;
                setState(selectedState);
                setDistrict((INDIAN_STATES_DISTRICTS[selectedState] || [""])[0]);
              }}>
                {Object.keys(INDIAN_STATES_DISTRICTS).map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>

            <Field label="District *">
              <select className={inputClassName} value={district} onChange={(event) => setDistrict(event.target.value)}>
                {(INDIAN_STATES_DISTRICTS[state] || []).map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>

            <Field label="Town / Village / Ward *" error={errors.townVillage}>
              <input
                aria-invalid={Boolean(errors.townVillage)}
                className={cn(inputClassName, errors.townVillage && "border-destructive focus-visible:ring-destructive/20")}
                maxLength={REPORT_LIMITS.townVillageMax}
                value={townVillage}
                onChange={(event) => setFieldValue("townVillage", setTownVillage, event.target.value)}
                placeholder="e.g. Baner, Indiranagar, Rohini"
              />
            </Field>

            <Field label="Pincode *" error={errors.pincode}>
              <input
                aria-invalid={Boolean(errors.pincode)}
                className={cn(inputClassName, errors.pincode && "border-destructive focus-visible:ring-destructive/20")}
                inputMode="numeric"
                maxLength={6}
                value={pincode}
                onChange={(event) => setFieldValue("pincode", setPincode, event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit pincode"
              />
            </Field>

            {mode === "detailed" ? (
              <Field label="Specific landmark / road" error={errors.locationName} className="md:col-span-2">
                <input
                  aria-invalid={Boolean(errors.locationName)}
                  className={cn(inputClassName, errors.locationName && "border-destructive focus-visible:ring-destructive/20")}
                  maxLength={REPORT_LIMITS.locationNameMax}
                  value={locationName}
                  onChange={(event) => setFieldValue("locationName", setLocationName, event.target.value)}
                  placeholder="e.g. Near Indiranagar Metro Station"
                />
              </Field>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="border-b border-border pb-3 text-lg font-semibold text-foreground">3. Evidence and context</h2>
          <div className="grid grid-cols-1 gap-6">
            {mode === "detailed" ? (
              <Field label="Detailed description / notes" error={errors.summary}>
                <textarea
                  aria-invalid={Boolean(errors.summary)}
                  rows={5}
                  className={cn(inputClassName, "resize-none", errors.summary && "border-destructive focus-visible:ring-destructive/20")}
                  maxLength={REPORT_LIMITS.summaryMax}
                  value={summary}
                  onChange={(event) => setFieldValue("summary", setSummary, event.target.value)}
                  placeholder="Provide any additional details, repeated history, or evidence notes."
                />
                <span className="text-xs font-bold text-muted-foreground">{summary.trim().length}/{REPORT_LIMITS.summaryMax} characters</span>
              </Field>
            ) : null}

            <Field label="Photo evidence" error={errors.photo}>
              <div className="rounded-md border border-dashed border-border bg-muted/60 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"><Camera size={14} /> Stored privately before review</div>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="w-full text-sm font-semibold text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-card file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-foreground hover:file:bg-muted"
                  onChange={(event) => {
                    const selected = Array.from(event.target.files ?? []);
                    setPhotos(selected);
                    const photoError = getPhotoValidationError(selected);
                    if (photoError) {
                      setErrors((current) => ({ ...current, photo: photoError }));
                    } else {
                      clearError("photo");
                    }
                  }}
                />
                <p className="mt-3 text-xs font-bold text-muted-foreground">JPG, PNG, or WebP. Maximum {REPORT_LIMITS.photoMaxCount} images, 10 MB each.</p>
                {photos.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-xs font-medium text-muted-foreground">
                    {photos.map((item) => (
                      <li key={`${item.name}-${item.size}`}>
                        {item.name} · {(item.size / 1024 / 1024).toFixed(1)} MB
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </Field>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <Button variant="ghost" onClick={useLocation}><MapPin size={16} /> Use my location</Button>
          <Button disabled={busy} onClick={submitReport} className="px-8"><Send size={16} /> {busy ? "Submitting..." : "Submit report"}</Button>
        </div>
      </Card>

      {message ? (
        <Notice className="mt-6" tone={Object.keys(errors).length > 0 || message.toLowerCase().includes("not") || message.toLowerCase().includes("required") || message.toLowerCase().includes("error") ? "urgent" : "success"}>
          {message}
        </Notice>
      ) : null}
    </PageShell>
  );
}
