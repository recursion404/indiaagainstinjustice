"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function VolunteerPage() {
  const [values, setValues] = useState({ name: "", email: "", interest: "Report verification", message: "" });
  const [message, setMessage] = useState("Help review reports, verify outcomes and document recurring traffic points.");
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    const { data } = await supabase.auth.getSession();
    const { error } = await supabase.from("volunteer_requests").insert({ ...values, user_id: data.session?.user.id ?? null });
    setMessage(error ? error.message : "Thanks. The volunteer team will contact you.");
    if (!error) setValues({ name: "", email: "", interest: "Report verification", message: "" });
    setBusy(false);
  }
  return <main className="container band"><h1>Volunteer for Pune Against Traffic Jams</h1><p className="muted">Help review reports, verify public outcomes, document recurring traffic points and turn citizen observations into accountable action.</p><section className="card form"><label className="field">Name<input value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label><label className="field">Email<input type="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} /></label><label className="field">I can help with<select value={values.interest} onChange={(event) => setValues({ ...values, interest: event.target.value })}><option>Report verification</option><option>Traffic photography</option><option>Public transport observations</option><option>Content and research</option><option>Community outreach</option></select></label><label className="field">Message<textarea rows={4} value={values.message} onChange={(event) => setValues({ ...values, message: event.target.value })} /></label><button className="button" type="button" disabled={busy} onClick={submit}>{busy ? "Sending..." : "Join the volunteer group"}</button><p className="notice">{message}</p></section></main>;
}
