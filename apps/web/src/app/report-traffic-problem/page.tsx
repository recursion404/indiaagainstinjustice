"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const categories = [
  ["traffic_jam", "Traffic jam"],
  ["road_damage", "Road problem"],
  ["signal_issue", "Signal issue"],
  ["illegal_parking", "Illegal parking"],
  ["public_transport", "Public transport"],
  ["unsafe_junction", "Unsafe junction"],
  ["other", "Other"]
];

function makePublicId() {
  return `PUN-${Math.floor(100000 + Math.random() * 900000)}`;
}

function makeSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function ReportTrafficProblemPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("traffic_jam");
  const [area, setArea] = useState("");
  const [summary, setSummary] = useState("");
  const [privateAddress, setPrivateAddress] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [message, setMessage] = useState("Sign in or create an account before submitting a report.");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleAuth() {
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } }
        });
        if (error) throw error;
        if (data.user && data.session) {
          await supabase.from("profiles").upsert({ id: data.user.id, full_name: fullName.trim(), role: "citizen" });
        }
        setMessage(data.session ? "Account created. You can submit your report." : "Account created. Confirm your email, then sign in.");
        if (!data.session) setMode("signin");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        await supabase.from("profiles").upsert({ id: data.user.id, full_name: data.user.user_metadata.full_name ?? "", role: "citizen" });
        setMessage("Signed in. Your report will be private until it is reviewed.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to authenticate.");
    } finally {
      setBusy(false);
    }
  }

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
    if (!session) return setMessage("Please sign in before submitting a report.");
    if (!title.trim() || !area.trim() || !summary.trim()) return setMessage("Title, area and public summary are required.");
    setBusy(true);
    try {
      const publicId = makePublicId();
      const slug = makeSlug(`${area}-${title}-${publicId}`);
      const { data: issue, error } = await supabase.from("traffic_issues").insert({
        public_id: publicId,
        reporter_id: session.user.id,
        title: title.trim(),
        slug,
        category,
        area: area.trim(),
        public_summary: summary.trim(),
        private_address: privateAddress.trim() || null,
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null
      }).select("id, public_id").single();
      if (error) throw error;

      if (photo) {
        const storagePath = `${session.user.id}/${issue.id}/${Date.now()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
        const upload = await supabase.storage.from("issue-photos").upload(storagePath, photo, { contentType: photo.type || "image/jpeg" });
        if (upload.error) throw upload.error;
        const photoInsert = await supabase.from("issue_photos").insert({ issue_id: issue.id, storage_path: storagePath, alt_text: `Citizen photo for ${publicId}`, is_public: false });
        if (photoInsert.error) throw photoInsert.error;
      }
      setMessage(`Report ${issue.public_id} submitted for review. It is private until an admin verifies it.`);
      setTitle(""); setArea(""); setSummary(""); setPrivateAddress(""); setPhoto(null); setCoordinates(null);
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
      {!session ? (
        <section className="card form">
          <div className="actions"><button className={`button ${mode === "signin" ? "" : "secondary"}`} type="button" onClick={() => setMode("signin")}>Sign in</button><button className={`button ${mode === "signup" ? "" : "secondary"}`} type="button" onClick={() => setMode("signup")}>Create account</button></div>
          {mode === "signup" ? <label className="field">Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} required /></label> : null}
          <label className="field">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label className="field">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          <button className="button" type="button" disabled={busy} onClick={handleAuth}>{busy ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}</button>
        </section>
      ) : (
        <section className="card form">
          <p className="status">Signed in as {session.user.email}</p>
          <label className="field">Problem title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Heavy traffic near Baner main road" /></label>
          <label className="field">Category<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="field">Area<input value={area} onChange={(event) => setArea(event.target.value)} placeholder="Baner, Wakad, Hinjewadi..." /></label>
          <label className="field">Public summary<textarea rows={5} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Describe what citizens should know publicly." /></label>
          <label className="field">Private address or landmark<input value={privateAddress} onChange={(event) => setPrivateAddress(event.target.value)} placeholder="Optional, never shown publicly" /></label>
          <label className="field">Photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} /></label>
          <div className="actions"><button className="button secondary" type="button" onClick={useLocation}>Use my location</button><button className="button" type="button" disabled={busy} onClick={submitReport}>{busy ? "Submitting..." : "Submit report"}</button></div>
        </section>
      )}
      <p className="notice">{message}</p>
    </main>
  );
}
