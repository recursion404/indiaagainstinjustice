"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getPledgeCount } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, CheckCircle2, Users, Heart } from "lucide-react";

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

  const pledgePillars = [
    "I will respect automatic traffic signals and police instructions.",
    "I will strictly avoid wrong-side driving, even for short-distance transits.",
    "I will keep zebra crossings and lanes clear for pedestrians.",
    "I will avoid blocking public bus transport stops and yellow-coded curbs.",
    "I will actively promote and support safer, inclusive roads across Pune."
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-700 border border-orange-100 uppercase tracking-widest mb-4">
          <ShieldCheck size={12} className="text-orange-600" /> Civic Duty
        </span>
        <h1 className="text-4xl font-black text-slate-950 tracking-tight mb-3">
          The Safe Roads Pledge
        </h1>
        <p className="text-slate-500 font-semibold leading-relaxed">
          Traffic transformation starts with personal accountability. Join verified Pune citizens taking the pledge to uphold baseline road ethics.
        </p>

        <div className="flex items-center justify-center gap-2 mt-6 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl w-fit mx-auto text-sm font-bold text-slate-600">
          <Users size={16} className="text-orange-600" />
          <span className="text-slate-900 font-black">{count}</span> citizens have taken the pledge
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
        {/* Core Pledge Checklist */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-900/5 p-8 md:col-span-3 space-y-6">
          <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">
            Pledge Commitments
          </h2>
          
          <ul className="space-y-4">
            {pledgePillars.map((item, index) => (
              <li className="flex gap-3 text-slate-600 text-sm font-semibold leading-relaxed" key={index}>
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Action Panel */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-900/5 p-6 md:col-span-2 space-y-6">
          <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-1.5">
            <Heart size={16} className="text-orange-600" /> Sign Pledge
          </h2>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Public Name</label>
              <input
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Optional (e.g. Rahul P.)"
              />
            </div>

            <button 
              className="w-full px-6 py-3.5 text-sm font-black text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 rounded-xl shadow-lg shadow-orange-100 disabled:opacity-50 transition-all cursor-pointer"
              type="button" 
              disabled={pledged} 
              onClick={takePledge}
            >
              {pledged ? "Pledge Recorded ✓" : "Take Pledge"}
            </button>
          </div>

          {message && (
            <div className={`p-4 rounded-xl border text-xs font-extrabold ${
              message.toLowerCase().includes("not") || message.toLowerCase().includes("sign in") || message.toLowerCase().includes("already")
                ? "bg-rose-50 border-rose-100 text-rose-800" 
                : "bg-emerald-50 border-emerald-100 text-emerald-800"
            }`}>
              {message}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
