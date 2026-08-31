"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users2, Mail, Award, CheckCircle2 } from "lucide-react";
import { Badge, Button, Card, Field, PageShell, SectionHeader, cn, inputClassName } from "@/components/ui";

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
    <PageShell className="max-w-4xl">
      <SectionHeader
        eyebrow={<Badge><Users2 size={12} /> Join forces</Badge>}
        title="Volunteer for India Against Injustice"
        description="Help review citizen reports, verify real-world outcomes, document civic issues, and turn local observations into accountable public action."
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
        <Card className="md:col-span-2 space-y-6">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-3 flex items-center gap-1.5">
            <Award size={16} className="text-primary" /> Why Volunteer?
          </h2>

          <ul className="space-y-4">
            <li className="flex gap-3 text-muted-foreground text-sm font-semibold leading-relaxed">
              <CheckCircle2 size={18} className="text-secondary shrink-0 mt-0.5" />
              <span>Verify crowd-sourced reports to maintain a highly credible public registry.</span>
            </li>
            <li className="flex gap-3 text-muted-foreground text-sm font-semibold leading-relaxed">
              <CheckCircle2 size={18} className="text-secondary shrink-0 mt-0.5" />
              <span>Provide photographic evidence of infrastructure progress and street safety issues.</span>
            </li>
            <li className="flex gap-3 text-muted-foreground text-sm font-semibold leading-relaxed">
              <CheckCircle2 size={18} className="text-secondary shrink-0 mt-0.5" />
              <span>Lead community outreach drives to onboard residential welfare groups.</span>
            </li>
          </ul>
        </Card>

        <Card className="md:col-span-3 space-y-6">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-3 flex items-center gap-1.5">
            <Mail size={16} className="text-primary" /> Apply Today
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full Name *" error={errors.name}>
                <input
                  aria-invalid={Boolean(errors.name)}
                  className={cn(inputClassName, errors.name && "border-destructive focus-visible:ring-destructive/20")}
                  maxLength={VOLUNTEER_LIMITS.nameMax}
                  value={values.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="Rahul Patil"
                />
              </Field>

              <Field label="Email Address *" error={errors.email}>
                <input
                  aria-invalid={Boolean(errors.email)}
                  className={cn(inputClassName, errors.email && "border-destructive focus-visible:ring-destructive/20")}
                  maxLength={VOLUNTEER_LIMITS.emailMax}
                  type="email"
                  value={values.email}
                  onChange={(event) => update("email", event.target.value)}
                  placeholder="rahul@domain.com"
                />
              </Field>
            </div>

            <Field label="I can help with" error={errors.interest}>
              <select
                aria-invalid={Boolean(errors.interest)}
                className={cn(inputClassName, errors.interest && "border-destructive focus-visible:ring-destructive/20")}
                value={values.interest}
                onChange={(event) => update("interest", event.target.value)}
              >
                <option>Report verification</option>
                <option>Traffic photography</option>
                <option>Public transport observations</option>
                <option>Content and research</option>
                <option>Community outreach</option>
              </select>
            </Field>

            <Field label="Introduce Yourself" error={errors.message}>
              <textarea
                aria-invalid={Boolean(errors.message)}
                className={cn(inputClassName, "min-h-28 resize-y", errors.message && "border-destructive focus-visible:ring-destructive/20")}
                maxLength={VOLUNTEER_LIMITS.messageMax}
                value={values.message}
                onChange={(event) => update("message", event.target.value)}
                placeholder="Tell us a little bit about your interest, background, or neighborhood..."
              />
              <div className="flex justify-between gap-3 text-xs font-bold">
                {errors.message ? <span className="text-destructive">{errors.message}</span> : <span />}
                <span className="ml-auto text-muted-foreground">{values.message.trim().length}/{VOLUNTEER_LIMITS.messageMax}</span>
              </div>
            </Field>

            <Button className="w-full" disabled={busy} onClick={submit}>
              {busy ? "Submitting Application..." : "Submit Application"}
            </Button>
          </div>

          {message && (
            <div className={`p-4 rounded-md border text-xs font-extrabold ${
              message.toLowerCase().includes("please") || message.toLowerCase().includes("not") || message.toLowerCase().includes("error")
                ? "bg-destructive/10 border-destructive/20 text-destructive"
                : "bg-primary/10 border-primary/20 text-primary"
            }`}>
              {message}
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
