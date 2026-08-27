"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users2, Mail, Award, CheckCircle2 } from "lucide-react";

export default function VolunteerPage() {
  const [values, setValues] = useState({ name: "", email: "", interest: "Report verification", message: "" });
  const [message, setMessage] = useState("Help review reports, verify outcomes and document recurring traffic points.");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!values.name.trim() || !values.email.trim()) {
      setMessage("Please fill out your Name and Email address.");
      return;
    }
    setBusy(true);
    const { data } = await supabase.auth.getSession();
    const { error } = await supabase.from("volunteer_requests").insert({ ...values, user_id: data.session?.user.id ?? null });
    setMessage(error ? error.message : "Thank you! Your volunteer application has been submitted successfully.");
    if (!error) setValues({ name: "", email: "", interest: "Report verification", message: "" });
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-700 border border-orange-100 uppercase tracking-widest mb-4">
          <Users2 size={12} className="text-orange-600" /> Join Forces
        </span>
        <h1 className="text-4xl font-black text-slate-950 tracking-tight mb-3">
          Volunteer for Pune Against Injustice
        </h1>
        <p className="text-slate-500 font-semibold leading-relaxed">
          Help review citizen reports, verify real-world outcomes, document chronic bottleneck locations, and turn local observations into accountable public actions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
        {/* Volunteer info */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-900/5 p-8 md:col-span-2 space-y-6">
          <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-1.5">
            <Award size={16} className="text-orange-600" /> Why Volunteer?
          </h2>
          
          <ul className="space-y-4">
            <li className="flex gap-3 text-slate-600 text-sm font-semibold leading-relaxed">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Verify crowd-sourced reports to maintain a highly credible public registry.</span>
            </li>
            <li className="flex gap-3 text-slate-600 text-sm font-semibold leading-relaxed">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Provide photographic evidence of infrastructure progress and street safety issues.</span>
            </li>
            <li className="flex gap-3 text-slate-600 text-sm font-semibold leading-relaxed">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Lead community outreach drives to onboard residential welfare groups.</span>
            </li>
          </ul>
        </section>

        {/* Volunteer Application Form */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-900/5 p-8 md:col-span-3 space-y-6">
          <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-1.5">
            <Mail size={16} className="text-orange-600" /> Apply Today
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Full Name *</label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all"
                  value={values.name}
                  onChange={(event) => setValues({ ...values, name: event.target.value })}
                  placeholder="Rahul Patil"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Email Address *</label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all"
                  type="email"
                  value={values.email}
                  onChange={(event) => setValues({ ...values, email: event.target.value })}
                  placeholder="rahul@domain.com"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">I can help with</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800 font-semibold text-sm transition-all bg-white"
                value={values.interest}
                onChange={(event) => setValues({ ...values, interest: event.target.value })}
              >
                <option>Report verification</option>
                <option>Traffic photography</option>
                <option>Public transport observations</option>
                <option>Content and research</option>
                <option>Community outreach</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Introduce Yourself</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all"
                rows={4}
                value={values.message}
                onChange={(event) => setValues({ ...values, message: event.target.value })}
                placeholder="Tell us a little bit about your interest, background, or neighborhood..."
              />
            </div>

            <button
              className="w-full px-6 py-3.5 text-sm font-black text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 rounded-xl shadow-lg shadow-orange-100 disabled:opacity-50 transition-all cursor-pointer"
              type="button"
              disabled={busy}
              onClick={submit}
            >
              {busy ? "Submitting Application..." : "Submit Application"}
            </button>
          </div>

          {message && (
            <div className={`p-4 rounded-xl border text-xs font-extrabold ${
              message.toLowerCase().includes("please") || message.toLowerCase().includes("not") || message.toLowerCase().includes("error")
                ? "bg-rose-50 border-rose-100 text-rose-800" 
                : "bg-orange-50 border-orange-100 text-orange-800"
            }`}>
              {message}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
