"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getPledgeCount } from "@/lib/data";
import { supabase } from "@/lib/supabase";

export default function TrafficRulesPledgePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [name, setName] = useState("");
  const [count, setCount] = useState(0);
  const [pledged, setPledged] = useState(false);
  const [message, setMessage] = useState("Sign in before taking the pledge.");

  async function loadCount() { setCount(await getPledgeCount()); }
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    void loadCount();
    return () => listener.subscription.unsubscribe();
  }, []);

  async function takePledge() {
    if (!session) return setMessage("Sign in on the report page before taking the pledge.");
    const { error } = await supabase.from("pledges").insert({ user_id: session.user.id, public_name: name.trim() || null, city: "Pune" });
    if (error) setMessage(error.code === "23505" ? "You have already taken the pledge." : error.message);
    else { setPledged(true); setMessage("Pledge recorded. Thank you for supporting safer Pune roads."); await loadCount(); }
  }

  return <main className="container band"><h1>Pune Traffic Rules Pledge</h1><section className="card form"><span className="status">{count} citizens pledged</span><p>I will respect signals, avoid wrong-side driving, keep lanes clear, not block public transport stops and support safer Pune roads.</p><label className="field">Your public name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Optional" /></label><button className="button" type="button" disabled={pledged} onClick={takePledge}>{pledged ? "Pledge recorded" : "Take pledge"}</button><p className="notice">{message}</p></section></main>;
}
