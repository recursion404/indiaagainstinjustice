"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, FileText, UserCheck, XCircle } from "lucide-react";
import { Badge, Button, ButtonLink, Card, Notice, PageShell, StatCard } from "@/components/ui";
import { dashboardPathForProfile, type AccountRole, type RoleApprovalStatus } from "@/lib/accountRoles";
import { decideAdminRequest, getAdminIssues, getPendingAdminRequests, type AdminApprovalRequest } from "@/lib/data";
import { supabase } from "@/lib/supabase";

function formatDate(value: string | null) {
  if (!value) return "Not dated";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function SuperadminPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AdminApprovalRequest[]>([]);
  const [totalReports, setTotalReports] = useState(0);
  const [message, setMessage] = useState<{ tone: "success" | "urgent" | "muted"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void loadSuperadmin();
  }, []);

  async function loadSuperadmin() {
    setLoading(true);
    setMessage(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, requested_role, role_approval_status")
        .eq("id", sessionData.session.user.id)
        .maybeSingle();

      if (error) throw error;

      const nextPath = dashboardPathForProfile(profile ? {
        role: profile.role as AccountRole,
        requested_role: (profile.requested_role ?? profile.role) as AccountRole,
        role_approval_status: (profile.role_approval_status ?? "not_required") as RoleApprovalStatus
      } : null);

      if (nextPath !== "/superadmin") {
        router.replace(nextPath);
        return;
      }

      const [nextRequests, reports] = await Promise.all([
        getPendingAdminRequests(),
        getAdminIssues().catch(() => [])
      ]);

      setRequests(nextRequests);
      setTotalReports(reports.length);
    } catch (error) {
      setMessage({ tone: "urgent", text: error instanceof Error ? error.message : "Unable to load superadmin dashboard." });
    } finally {
      setLoading(false);
    }
  }

  async function decide(request: AdminApprovalRequest, decision: "approved" | "rejected") {
    setBusyId(request.id);
    setMessage(null);

    try {
      await decideAdminRequest(request.id, decision);
      setRequests((current) => current.filter((item) => item.id !== request.id));
      setMessage({
        tone: "success",
        text: decision === "approved"
          ? `${request.email ?? "Admin request"} approved. The account can now access moderation.`
          : `${request.email ?? "Admin request"} rejected. The account remains a citizen account.`
      });
    } catch (error) {
      setMessage({ tone: "urgent", text: error instanceof Error ? error.message : "Unable to save the admin request decision." });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-muted/40">
      <PageShell className="py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 rounded-lg border border-border bg-card p-5 shadow-sm md:flex-row md:items-center">
          <div>
            <Badge>Superadmin workspace</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Account governance</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Approve admin access separately from the moderation dashboard.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/admin" variant="secondary">
              <FileText size={16} /> Open moderation
            </ButtonLink>
            <Button onClick={loadSuperadmin} variant="ghost">
              Refresh
            </Button>
          </div>
        </div>

        {message ? <Notice className="mb-6" tone={message.tone}>{message.text}</Notice> : null}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <StatCard label="Pending admin requests" value={loading ? "..." : requests.length} />
          <StatCard label="Moderation reports" value={loading ? "..." : totalReports} />
          <StatCard label="Access model" value="Role routes" />
        </div>

        <Card>
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Admin approval queue</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Admin applicants can sign in while this request is pending, but they stay on the pending dashboard.
              </p>
            </div>
            <span className="hidden h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary sm:flex">
              <UserCheck size={18} />
            </span>
          </div>

          {loading ? (
            <p className="text-sm font-medium text-muted-foreground">Loading approval requests...</p>
          ) : requests.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted p-10 text-center">
              <h3 className="text-lg font-semibold text-foreground">No pending admin requests</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                New admin signup requests will appear here for review.
              </p>
              <div className="mt-6">
                <ButtonLink href="/dashboard" variant="secondary">Open my dashboard</ButtonLink>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {requests.map((request) => (
                <article className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between" key={request.id}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">
                        {request.displayName || request.fullName || request.email || "Unnamed applicant"}
                      </h3>
                      <Badge tone="muted">
                        <Clock3 size={12} /> {formatDate(request.roleRequestedAt)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{request.email ?? "No email recorded"}</p>
                    <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Current role: {request.role} · Requested role: {request.requestedRole}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      disabled={busyId === request.id}
                      onClick={() => decide(request, "approved")}
                    >
                      <CheckCircle2 size={16} /> Approve admin
                    </Button>
                    <Button
                      disabled={busyId === request.id}
                      onClick={() => decide(request, "rejected")}
                      variant="secondary"
                    >
                      <XCircle size={16} /> Reject
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Card>

        <p className="mt-6 text-xs text-muted-foreground">
          Need the public site? <Link className="font-medium text-primary hover:underline" href="/">Return home</Link>.
        </p>
      </PageShell>
    </main>
  );
}
