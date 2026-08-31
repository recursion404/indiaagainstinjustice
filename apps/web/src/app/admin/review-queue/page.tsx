"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { IssueStatus } from "@citizens-first/shared";
import { issueStatuses } from "@citizens-first/shared";
import { ArrowLeft, Eye, Filter, ListChecks, Search, ShieldAlert } from "lucide-react";
import { Badge, ButtonLink, Card, EmptyState, PageShell, inputClassName } from "@/components/ui";
import { getAdminIssues, type AdminIssue } from "@/lib/data";
import { supabase } from "@/lib/supabase";

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function formatDate(value: string | null) {
  if (!value) return "Not dated";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function ReviewQueuePage() {
  const router = useRouter();
  const [issues, setIssues] = useState<AdminIssue[]>([]);
  const [status, setStatus] = useState<"all" | IssueStatus>("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("Loading reported issues...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQueue() {
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
          setMessage("This account is not authorized for the admin review queue.");
          return;
        }

        const nextIssues = await getAdminIssues();
        setIssues(nextIssues);
        setMessage(`${nextIssues.length} reported issues loaded.`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to load the review queue.");
      } finally {
        setLoading(false);
      }
    }

    void loadQueue();
  }, [router]);

  const filteredIssues = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return issues.filter((issue) => {
      if (status !== "all" && issue.status !== status) return false;
      if (!normalized) return true;

      return [
        issue.publicId,
        issue.title,
        issue.summary,
        issue.category,
        issue.customCategory,
        issue.status,
        issue.state,
        issue.district,
        issue.townVillage,
        issue.pincode
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });
  }, [issues, search, status]);

  return (
    <main className="min-h-screen bg-muted/40">
      <PageShell className="py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 rounded-lg border border-border bg-card p-5 shadow-sm md:flex-row md:items-center">
          <div>
            <ButtonLink href="/admin" variant="ghost" className="-ml-4 mb-3">
              <ArrowLeft size={16} /> Dashboard
            </ButtonLink>
            <Badge><ListChecks size={12} /> Admin review queue</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Reported issues</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Newest reports appear first. Filter by workflow status, then open an issue to review details.
            </p>
          </div>
          <div className="rounded-md border border-border bg-muted px-4 py-3 text-sm font-medium text-muted-foreground">
            {loading ? "Loading..." : `${filteredIssues.length} visible`}
          </div>
        </div>

        <Card className="mb-6">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                className={`${inputClassName} pl-10`}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by public ID, title, location, category..."
                value={search}
              />
            </label>
            <label className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <select
                className={`${inputClassName} pl-10 capitalize`}
                onChange={(event) => setStatus(event.target.value as "all" | IssueStatus)}
                value={status}
              >
                <option value="all">All statuses</option>
                {issueStatuses.map((item) => (
                  <option key={item} value={item}>{statusLabel(item)}</option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        {filteredIssues.length === 0 ? (
          <EmptyState
            title={loading ? "Loading reported issues" : "No reports match this filter"}
            description={message}
            action={<ButtonLink href="/admin" variant="secondary">Back to dashboard</ButtonLink>}
          />
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left">
                <thead>
                  <tr className="border-b border-border bg-muted text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3">Reported issue</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Location</th>
                    <th className="px-5 py-3">Reported</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredIssues.map((issue) => (
                    <tr className="bg-card transition hover:bg-muted/60" key={issue.id}>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-foreground">{issue.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{issue.publicId} · {statusLabel(issue.category)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium capitalize text-foreground">
                          {statusLabel(issue.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {issue.townVillage}, {issue.district || issue.state}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{formatDate(issue.createdAt)}</td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
                          href={`/admin/review-queue/${issue.id}`}
                        >
                          <Eye size={15} /> View issue
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {!loading && message.includes("not authorized") ? (
          <div className="mt-6 rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
            <ShieldAlert className="mr-2 inline" size={16} /> {message}
          </div>
        ) : null}
      </PageShell>
    </main>
  );
}
