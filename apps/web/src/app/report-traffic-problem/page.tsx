"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { CivicCategory } from "@citizens-first/shared";
import { supabase } from "@/lib/supabase";

const INDIAN_STATES_DISTRICTS: Record<string, string[]> = {
  "Maharashtra": ["Pune", "Mumbai City", "Mumbai Suburban", "Thane", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Amravati", "Kolhapur"],
  "Karnataka": ["Bangalore Urban", "Bangalore Rural", "Mysore", "Belgaum", "Mangalore", "Hubli-Dharwad", "Tumkur", "Gulbarga"],
  "Delhi": ["Central Delhi", "New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Tirunelveli", "Vellore"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Ghaziabad", "Agra", "Varanasi", "Allahabad", "Meerut"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar"],
  "Telangana": ["Hyderabad", "Ranga Reddy", "Warangal", "Nizamabad", "Karimnagar"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Hooghly", "North 24 Parganas", "South 24 Parganas"],
  "Kerala": ["Trivandrum", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kannur"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"]
};

export default function ReportTrafficProblemPage() {
  const [session, setSession] = useState<Session | null>(null);
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
  const [photo, setPhoto] = useState<File | null>(null);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));

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
        console.warn("Failed to load categories:", err);
      }
    }
    loadCategories();

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
    if (!title.trim()) newErrors.title = "Issue title/summary is required.";
    if (!state.trim()) newErrors.state = "State is required.";
    if (!townVillage.trim()) newErrors.townVillage = "Town / Village / Ward is required.";
    if (!pincode.trim()) {
      newErrors.pincode = "Pincode is required.";
    } else if (!/^\d{6}$/.test(pincode.trim())) {
      newErrors.pincode = "Pincode must be exactly 6 digits.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setMessage("Please resolve the highlighted errors in the form.");
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const { data: reportId, error } = await supabase.rpc("submit_report_rpc", {
        p_reporter_name:              "Citizen",
        p_reporter_mobile:            "",
        p_category:                   category,
        p_subcategory:                category === "other" ? customCategory.trim() : null,
        p_summary:                    title.trim(),
        p_description:                summary.trim() || "",
        p_state:                      state.trim(),
        p_district:                   district.trim() || null,
        p_town_village:               townVillage.trim(),
        p_pincode:                    pincode.trim(),
        p_photo_url:                  null,
        p_video_url:                  null,
        p_additional_location_detail: locationName.trim() || null
      });

      if (error) throw error;

      const reportUUID = reportId as string;
      const publicId = `Report-${reportUUID.substring(0, 8)}`;

      if (photo) {
        const storageBucket = session?.user.id ?? "anonymous";
        const storagePath = `${storageBucket}/${reportUUID}/${Date.now()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
        const upload = await supabase.storage.from("issue-photos").upload(storagePath, photo, { contentType: photo.type || "image/jpeg" });
        if (upload.error) throw upload.error;
        const photoInsert = await supabase.from("issue_photos").insert({ issue_id: reportUUID, storage_path: storagePath, alt_text: `Evidence photo for ${publicId}`, is_public: false });
        if (photoInsert.error) throw photoInsert.error;
      }

      const successMessage = `Report ${publicId} submitted for review. It is private until an admin verifies it.`;
      setMessage(successMessage);
      window.alert(successMessage);
      setTitle(""); setState("Maharashtra"); setDistrict("Pune"); setTownVillage(""); setSummary(""); setPhoto(null); setCoordinates(null);
      setLocationName(""); setPincode(""); setCustomCategory(""); setCategory("traffic");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-4 mb-10">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            Report an Injustice / Issue
          </h1>
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider">
            Private before review
          </span>
        </div>
        <p className="text-sm font-semibold text-slate-500 max-w-2xl leading-relaxed">
          Your report, address, location, and photos stay private until an administrator verifies what can be published.
        </p>
      </div>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-900/5 p-8 sm:p-10 space-y-6">
        {session && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm font-semibold text-slate-600">
            Signed in as {session.user.email}
          </div>
        )}

        {/* Section 1: Core Details */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">1. Issue Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-extrabold text-slate-700">Issue Title / Summary *</label>
              <input
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.title ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" : "border-slate-200 focus:ring-orange-500/20 focus:border-orange-500"
                } outline-none text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all`}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Unfinished road bridge causing severe safety hazard"
              />
              {errors.title && <span className="text-xs font-bold text-red-500 mt-1">{errors.title}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-extrabold text-slate-700">Category / Topic *</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800 font-semibold text-sm bg-white transition-all"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {(categoriesList.length > 0 ? categoriesList : [
                  { slug: "traffic", label: "Traffic & Road Safety" },
                  { slug: "infrastructure", label: "Infrastructure & Roads" },
                  { slug: "garbage", label: "Garbage & Sanitation" },
                  { slug: "corruption", label: "Corruption & Bribes" },
                  { slug: "other", label: "Other Civil Issues" }
                ]).map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {category === "other" && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-extrabold text-slate-700">Describe category *</label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all"
                  value={customCategory}
                  onChange={(event) => setCustomCategory(event.target.value)}
                  placeholder="Describe this topic"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Location Details */}
        <div className="space-y-6 pt-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">2. Location Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-extrabold text-slate-700">State *</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800 font-semibold text-sm bg-white transition-all cursor-pointer"
                value={state}
                onChange={(event) => {
                  const selectedState = event.target.value;
                  setState(selectedState);
                  const districts = INDIAN_STATES_DISTRICTS[selectedState] || [];
                  setDistrict(districts[0] || "");
                }}
              >
                {Object.keys(INDIAN_STATES_DISTRICTS).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-extrabold text-slate-700">District *</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800 font-semibold text-sm bg-white transition-all cursor-pointer"
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
              >
                {(INDIAN_STATES_DISTRICTS[state] || []).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-extrabold text-slate-700">Town / Village / Ward *</label>
              <input
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.townVillage ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" : "border-slate-200 focus:ring-orange-500/20 focus:border-orange-500"
                } outline-none text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all`}
                value={townVillage}
                onChange={(event) => setTownVillage(event.target.value)}
                placeholder="e.g. Baner, Indiranagar, Rohini..."
              />
              {errors.townVillage && <span className="text-xs font-bold text-red-500 mt-1">{errors.townVillage}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-extrabold text-slate-700">Pincode *</label>
              <input
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.pincode ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" : "border-slate-200 focus:ring-orange-500/20 focus:border-orange-500"
                } outline-none text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all`}
                value={pincode}
                onChange={(event) => setPincode(event.target.value)}
                placeholder="Enter 6-digit pincode"
              />
              {errors.pincode && <span className="text-xs font-bold text-red-500 mt-1">{errors.pincode}</span>}
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-extrabold text-slate-700">Specific Landmark / Road (Optional)</label>
              <input
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all"
                value={locationName}
                onChange={(event) => setLocationName(event.target.value)}
                placeholder="e.g. Near Indiranagar Metro Station"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Evidence & Description */}
        <div className="space-y-6 pt-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">3. Evidence & Context</h2>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-extrabold text-slate-700">Detailed Description / Notes (Optional)</label>
              <textarea
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all resize-none"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Provide any additional details or evidence notes..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-extrabold text-slate-700">Photo Evidence</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="w-full text-sm font-semibold text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 transition-all cursor-pointer"
                onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
              />
            </div>
          </div>
        </div>

        {/* Form CTA Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-100">
          <button
            className="px-5 py-3 text-sm font-bold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
            type="button"
            onClick={useLocation}
          >
            📍 Use my location
          </button>
          
          <button
            className="px-8 py-3.5 text-sm font-black text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 rounded-xl shadow-lg shadow-orange-100 disabled:opacity-50 transition-all"
            type="button"
            disabled={busy}
            onClick={submitReport}
          >
            {busy ? "Submitting..." : "Submit report"}
          </button>
        </div>
      </section>

      {message && (
        <div className={`mt-6 p-4 rounded-xl border text-sm font-extrabold ${
          Object.keys(errors).length > 0 || message.toLowerCase().includes("not") || message.toLowerCase().includes("required") || message.toLowerCase().includes("error")
            ? "bg-rose-50 border-rose-100 text-rose-800" 
            : "bg-emerald-50 border-emerald-100 text-emerald-800"
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
