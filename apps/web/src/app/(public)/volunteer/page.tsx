"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users2, Mail, Award, CheckCircle2 } from "lucide-react";

const VOLUNTEER_LIMITS = {
  nameMin: 2,
  nameMax: 80,
  emailMax: 254,
  messageMax: 800
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function VolunteerPage() {
  const [values, setValues] = useState({ name: "", email: "", interest: "Report verification", message: "" });
  const [message, setMessage] = useState("Help review reports, verify outcomes and document recurring traffic points.");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function validate() {
    const nextErrors: Record<string, string> = {};
    const name = values.name.trim();
    const email = values.email.trim();
    const note = values.message.trim();

    if (!name) nextErrors.name = "Enter your full name.";
    else if (name.length < VOLUNTEER_LIMITS.nameMin) nextErrors.name = `Name must be at least ${VOLUNTEER_LIMITS.nameMin} characters.`;
    else if (name.length > VOLUNTEER_LIMITS.nameMax) nextErrors.name = `Name must be ${VOLUNTEER_LIMITS.nameMax} characters or fewer.`;

    if (!email) nextErrors.email = "Enter an email address so we can contact you.";
    else if (email.length > VOLUNTEER_LIMITS.emailMax) nextErrors.email = "Email address is too long.";
    else if (!emailPattern.test(email)) nextErrors.email = "Enter a valid email address, for example name@example.com.";

    if (!values.interest.trim()) nextErrors.interest = "Choose how you want to help.";
    if (note.length > VOLUNTEER_LIMITS.messageMax) nextErrors.message = `Introduction must be ${VOLUNTEER_LIMITS.messageMax} characters or fewer.`;

    return nextErrors;
  }

  async function submit() {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setMessage("Please fix the highlighted fields before submitting.");
      return;
    }

    setErrors({});
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      const payload = {
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        interest: values.interest.trim(),
        message: values.message.trim(),
        user_id: data.session?.user.id ?? null
      };
      const { error } = await supabase.from("volunteer_requests").insert(payload);
      if (error) throw error;

      setMessage("Thank you! Your volunteer application has been submitted successfully.");
      setValues({ name: "", email: "", interest: "Report verification", message: "" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit volunteer application.");
    } finally {
      setBusy(false);
    }
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
                  aria-invalid={Boolean(errors.name)}
                  className={`w-full px-4 py-3 rounded-xl border outline-none text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all focus:ring-2 ${errors.name ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20" : "border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"}`}
                  maxLength={VOLUNTEER_LIMITS.nameMax}
                  value={values.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="Rahul Patil"
                />
                {errors.name ? <span className="text-xs font-bold text-rose-600">{errors.name}</span> : null}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Email Address *</label>
                <input
                  aria-invalid={Boolean(errors.email)}
                  className={`w-full px-4 py-3 rounded-xl border outline-none text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all focus:ring-2 ${errors.email ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20" : "border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"}`}
                  maxLength={VOLUNTEER_LIMITS.emailMax}
                  type="email"
                  value={values.email}
                  onChange={(event) => update("email", event.target.value)}
                  placeholder="rahul@domain.com"
                />
                {errors.email ? <span className="text-xs font-bold text-rose-600">{errors.email}</span> : null}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">I can help with</label>
              <select
                aria-invalid={Boolean(errors.interest)}
                className={`w-full px-4 py-3 rounded-xl border outline-none text-slate-800 font-semibold text-sm transition-all bg-white focus:ring-2 ${errors.interest ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20" : "border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"}`}
                value={values.interest}
                onChange={(event) => update("interest", event.target.value)}
              >
                <option>Report verification</option>
                <option>Traffic photography</option>
                <option>Public transport observations</option>
                <option>Content and research</option>
                <option>Community outreach</option>
              </select>
              {errors.interest ? <span className="text-xs font-bold text-rose-600">{errors.interest}</span> : null}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Introduce Yourself</label>
              <textarea
                aria-invalid={Boolean(errors.message)}
                className={`w-full px-4 py-3 rounded-xl border outline-none text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all focus:ring-2 ${errors.message ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20" : "border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"}`}
                maxLength={VOLUNTEER_LIMITS.messageMax}
                rows={4}
                value={values.message}
                onChange={(event) => update("message", event.target.value)}
                placeholder="Tell us a little bit about your interest, background, or neighborhood..."
              />
              <div className="flex justify-between gap-3 text-xs font-bold">
                {errors.message ? <span className="text-rose-600">{errors.message}</span> : <span />}
                <span className="ml-auto text-slate-400">{values.message.trim().length}/{VOLUNTEER_LIMITS.messageMax}</span>
              </div>
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
