"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { IssueStatus } from "@citizens-first/shared";
import { issueStatuses } from "@citizens-first/shared";
import { ArrowLeft, CheckCircle2, FileText, MessageSquare, ShieldAlert } from "lucide-react";
import { Badge, Button, ButtonLink, Card, Field, Notice, PageShell, inputClassName } from "@/components/ui";
import { addIssueUpdate, getAdminIssue, type AdminIssue, updateIssueModeration } from "@/lib/data";
import { supabase } from "@/lib/supabase";

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function formatDate(value: string | null) {
  if (!value) return "Not dated";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function ReviewIssuePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const issueId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [issue, setIssue] = useState<AdminIssue | null>(null);
  const [status, setStatus] = useState<IssueStatus>("submitted");
  const [rejectionReason, setRejectionReason] = useState("");
  const [context, setContext] = useState("");
  const [showContextPublicly, setShowContextPublicly] = useState(true);
  const [message, setMessage] = useState<{ tone: "success" | "urgent" | "muted"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadIssue() {
      setLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          router.replace("/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, requested_role, role_approval_status")
          .eq("id", sessionData.session.user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (profile?.requested_role === "admin" && profile.role_approval_status === "pending") {
          router.replace("/dashboard/admin-pending");
          return;
        }
        if (profile?.role !== "admin" && profile?.role !== "superadmin") {
          setMessage({ tone: "urgent", text: "This account is not authorized to review issues." });
          return;
        }

        const loadedIssue = await getAdminIssue(issueId);
        setIssue(loadedIssue);
        setStatus(loadedIssue.status);
        setRejectionReason(loadedIssue.rejectionReason ?? "");
      } catch (error) {
        setMessage({ tone: "urgent", text: error instanceof Error ? error.message : "Unable to load this issue." });
      } finally {
        setLoading(false);
      }
    }

    void loadIssue();
  }, [issueId, router]);

  async function saveReview() {
    if (!issue) return;
    setSaving(true);
    setMessage(null);

    try {
      const trimmedContext = context.trim();
      const savedIssue = await updateIssueModeration(issue.id, {
        status,
        rejectionReason,
        isPublic: issue.isPublic,
        isSensitive: issue.isSensitive,
        indexable: issue.indexable,
        authorityName: issue.authorityName ?? "",
        authorityReference: issue.authorityReference ?? "",
        internalNotes: "",
      });

      const nextIssue = { ...issue, status: savedIssue.status, rejectionReason: savedIssue.rejectionReason };
      setIssue(nextIssue);

      if (trimmedContext) {
        try {
          await addIssueUpdate(issue.id, "authority_response", trimmedContext, showContextPublicly);
          setContext("");
        } catch (error) {
          const detail = error instanceof Error ? error.message : "The extra context could not be saved.";
          setMessage({
            tone: "urgent",
            text: `${issue.publicId} status was saved, but extra context was not saved. Run the issue_updates migration and try adding the context again. ${detail}`
          });
          return;
        }
      }

      setMessage({ tone: "success", text: `${issue.publicId} was updated successfully.` });
    } catch (error) {
      setMessage({ tone: "urgent", text: error instanceof Error ? error.message : "Unable to save this issue review." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageShell>
        <p className="text-sm font-medium text-muted-foreground">Loading issue details...</p>
      </PageShell>
    );
  }

  if (!issue) {
    return (
      <PageShell className="max-w-2xl py-12">
        <Notice tone={message?.tone ?? "urgent"}>{message?.text ?? "Issue not found."}</Notice>
        <div className="mt-6">
          <ButtonLink href="/admin/review-queue" variant="secondary">
            <ArrowLeft size={16} /> Back to review queue
          </ButtonLink>
        </div>
      </PageShell>
    );
  }

  return (
    <main className="min-h-screen bg-muted/40">
      <PageShell className="py-8">
        <div className="mb-6">
          <ButtonLink href="/admin/review-queue" variant="ghost" className="-ml-4 mb-3">
            <ArrowLeft size={16} /> Review queue
          </ButtonLink>
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <Badge><FileText size={12} /> {issue.publicId}</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{issue.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {issue.townVillage}, {issue.district || issue.state} · Reported {formatDate(issue.createdAt)}
            </p>
          </div>
        </div>

        {message ? <Notice className="mb-6" tone={message.tone}>{message.text}</Notice> : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <Card>
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Issue details</h2>
                <p className="mt-1 text-sm text-muted-foreground">Read the submitted context before changing workflow status.</p>
              </div>
              <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium capitalize text-foreground">
                {statusLabel(issue.status)}
              </span>
            </div>

            <div className="space-y-5">
              <section>
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Public description</h3>
                <p className="mt-2 rounded-md border border-border bg-muted p-4 text-sm leading-7 text-foreground">
                  {issue.summary || "No description provided."}
                </p>
              </section>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoBlock label="Category" value={statusLabel(issue.category)} />
                <InfoBlock label="Subcategory" value={issue.customCategory || "Not provided"} />
                <InfoBlock label="Pincode" value={issue.pincode || "Not provided"} />
                <InfoBlock label="Location detail" value={issue.locationName || "Not provided"} />
              </div>

              <section className="rounded-md border border-destructive/20 bg-destructive/10 p-4">
                <div className="flex gap-2 text-destructive">
                  <ShieldAlert className="mt-0.5 shrink-0" size={16} />
                  <div>
                    <h3 className="text-sm font-semibold">Private review reminder</h3>
                    <p className="mt-1 text-xs leading-5">
                      Keep private citizen details out of public context. Add only safe, reviewable information.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </Card>

          <Card>
            <div className="mb-5 border-b border-border pb-4">
              <h2 className="text-xl font-semibold text-foreground">Admin review</h2>
              <p className="mt-1 text-sm text-muted-foreground">Change status or add extra context for this issue.</p>
            </div>

            <div className="space-y-4">
              <Field label="Workflow status">
                <select className={`${inputClassName} capitalize`} onChange={(event) => setStatus(event.target.value as IssueStatus)} value={status}>
                  {issueStatuses.map((item) => (
                    <option key={item} value={item}>{statusLabel(item)}</option>
                  ))}
                </select>
              </Field>

              <Field label="Rejection or postponement reason">
                <textarea
                  className={inputClassName}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  placeholder="Visible reason if the report is rejected or needs more information."
                  rows={3}
                  value={rejectionReason}
                />
              </Field>

              <Field label={<span className="flex items-center gap-2"><MessageSquare size={14} /> Extra context</span>}>
                <textarea
                  className={inputClassName}
                  maxLength={1200}
                  onChange={(event) => setContext(event.target.value)}
                  placeholder="Add authority response, admin note, or review context."
                  rows={4}
                  value={context}
                />
                <span className="text-xs font-normal text-muted-foreground">{context.length}/1200 characters</span>
              </Field>

              <label className="flex items-center gap-2 rounded-md border border-border bg-muted p-3 text-sm text-foreground">
                <input
                  checked={showContextPublicly}
                  onChange={(event) => setShowContextPublicly(event.target.checked)}
                  type="checkbox"
                />
                Show extra context on public issue timeline
              </label>

              <Button className="w-full" disabled={saving} onClick={saveReview}>
                <CheckCircle2 size={16} /> {saving ? "Saving..." : "Save review"}
              </Button>

              <Link className="block text-center text-sm font-medium text-muted-foreground hover:text-foreground" href="/admin/review-queue">
                Back to reported issues
              </Link>
            </div>
          </Card>
        </div>
      </PageShell>
    </main>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
