"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  issueCategories,
  issueCategoryLabels,
  type IssueCategory,
  type LocationKind,
  type TrafficCondition
} from "@citizens-first/shared";
import { supabase } from "@/lib/supabase";

const categories = issueCategories.map((value) => [value, issueCategoryLabels[value]] as const);

function makePublicId() {
  return `PUN-${Math.floor(100000 + Math.random() * 900000)}`;
}

function makeSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function ReportTrafficProblemPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<IssueCategory>(issueCategories[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [trafficCondition, setTrafficCondition] = useState<TrafficCondition>("heavy");
  const [locationKind, setLocationKind] = useState<LocationKind>("area");
  const [locationName, setLocationName] = useState("");
  const [area, setArea] = useState("");
  const [summary, setSummary] = useState("");
  const [suggestedSolution, setSuggestedSolution] = useState("");
  const [pincode, setPincode] = useState("");
  const [prabhagNumber, setPrabhagNumber] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
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
    if (!title.trim()) return setMessage("Problem title is required.");
    if (!area.trim()) return setMessage("Area is required.");
    if (!pincode.trim()) return setMessage("Pincode is required.");
    if (category === "other" && !customCategory.trim()) return setMessage("Please describe the category in the custom category field.");
    setBusy(true);
    try {
      const publicId = makePublicId();
      const slug = makeSlug(`${area}-${title}-${publicId}`);
      const userId = session?.user.id ?? null;
      const storageBucket = userId ?? "anonymous";

      const { data: rpcData, error } = await supabase.rpc("submit_traffic_issue", {
        p_public_id:          publicId,
        p_reporter_id:        userId,
        p_title:              title.trim(),
        p_slug:               slug,
        p_category:           category,
        p_custom_category:    category === "other" ? customCategory.trim() : null,
        p_traffic_condition:  trafficCondition,
        p_area:               area.trim(),
        p_public_summary:     summary.trim() || "",
        p_location_name:      locationName.trim() || area.trim(),
        p_location_kind:      locationKind,
        p_suggested_solution: suggestedSolution.trim() || null,
        p_pincode:            pincode.trim(),
        p_ward_number:        prabhagNumber.trim() || null,
        p_latitude:           coordinates?.latitude ?? null,
        p_longitude:          coordinates?.longitude ?? null
      });
      if (error) throw error;

      const issue = (rpcData as Array<{ id: string; public_id: string }>)[0];

      if (photo) {
        const storagePath = `${storageBucket}/${issue.id}/${Date.now()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
        const upload = await supabase.storage.from("issue-photos").upload(storagePath, photo, { contentType: photo.type || "image/jpeg" });
        if (upload.error) throw upload.error;
        const photoInsert = await supabase.from("issue_photos").insert({ issue_id: issue.id, storage_path: storagePath, alt_text: `Citizen photo for ${publicId}`, is_public: false });
        if (photoInsert.error) throw photoInsert.error;
      }
      const successMessage = `Report ${issue.public_id} submitted for review. It is private until an admin verifies it.`;
      setMessage(successMessage);
      window.alert(successMessage);
      setTitle(""); setArea(""); setSummary(""); setPhoto(null); setCoordinates(null);
      setTrafficCondition("heavy"); setLocationKind("area"); setLocationName("");
      setSuggestedSolution(""); setPincode(""); setPrabhagNumber(""); setCustomCategory("");
      setCategory(issueCategories[0]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container band">
      <div className="sectionHeader"><h1>Report Traffic Problems in Pune</h1><span className="status">Private before review</span></div>
      <p className="muted">Your report, address, location and photos stay private until an administrator verifies what can be published.</p>
      <section className="card form">
        {session ? (
          <p className="status">Signed in as {session.user.email}</p>
        ) : null}
        <label className="field">Problem title *<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Heavy traffic near Baner main road" /></label>
        <label className="field">Category *<select value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {category === "other" ? (
          <label className="field">Describe category *<input value={customCategory} onChange={(event) => setCustomCategory(event.target.value)} placeholder="Please describe the issue category" /></label>
        ) : null}
        <label className="field">Traffic condition<select value={trafficCondition} onChange={(event) => setTrafficCondition(event.target.value as TrafficCondition)}><option value="normal">Normal</option><option value="moderate">Moderate</option><option value="heavy">Heavy</option><option value="severe">Severe</option><option value="cleared">Cleared</option></select></label>
        <label className="field">Area *<input value={area} onChange={(event) => setArea(event.target.value)} placeholder="Baner, Wakad, Hinjewadi..." /></label>
        <label className="field">Location type<select value={locationKind} onChange={(event) => setLocationKind(event.target.value as LocationKind)}><option value="chowk">Chowk</option><option value="road">Road</option><option value="area">Area</option><option value="landmark">Landmark</option></select></label>
        <label className="field">Location name<input value={locationName} onChange={(event) => setLocationName(event.target.value)} placeholder="Baner Radha Chowk, Wakad Bridge..." /></label>
        <label className="field">Pincode *<input value={pincode} onChange={(event) => setPincode(event.target.value)} placeholder="411045" /></label>
        <label className="field">Public summary<textarea rows={5} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Optional: describe what citizens should know publicly." /></label>
        <label className="field">Suggested solution<textarea rows={3} value={suggestedSolution} onChange={(event) => setSuggestedSolution(event.target.value)} placeholder="Optional: change signal timing, remove illegal parking, open alternate road..." /></label>
        <label className="field">Prabhag number<input value={prabhagNumber} onChange={(event) => setPrabhagNumber(event.target.value)} placeholder="Optional" /></label>
        <label className="field">Photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} /></label>
        <div className="actions"><button className="button secondary" type="button" onClick={useLocation}>Use my location</button><button className="button" type="button" disabled={busy} onClick={submitReport}>{busy ? "Submitting..." : "Submit report"}</button></div>
      </section>
      {message ? <p className="notice">{message}</p> : null}
    </main>
  );
}
