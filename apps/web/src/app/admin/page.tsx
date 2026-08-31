"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { IssueStatus } from "@citizens-first/shared";
import { getAdminIssues, type AdminIssue } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import {
  AlertCircle,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock3,
  FileText,
  LayoutDashboard,
  ListChecks,
  Menu,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  X
} from "lucide-react";

const statuses: IssueStatus[] = [
  "submitted",
  "under_review",
  "verified",
  "published",
  "assigned",
  "action_started",
  "action_taken",
  "action_recorded",
  "citizen_verified",
  "resolved",
  "rejected",
  "duplicate",
  "insufficient_information",
  "reopened"
];

const AUTH_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: PromiseLike<T>, message: string, timeoutMs = AUTH_TIMEOUT_MS) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_resolve, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function countByStatus(issues: AdminIssue[], status: IssueStatus) {
  return issues.filter((issue) => issue.status === status).length;
}

function csvCell(value: string | number | null | undefined) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [issues, setIssues] = useState<AdminIssue[]>([]);
  const [filter, setFilter] = useState<"all" | IssueStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Admin access requires an authorized account.");
  const [moderationNotice, setModerationNotice] = useState<{
    tone: "success" | "error" | "info";
    title: string;
    detail: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session) void loadAdmin(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setRole(null);
        setIssues([]);
        return;
      }

      window.setTimeout(() => {
        if (!cancelled) void loadAdmin(nextSession);
      }, 0);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function loadAdmin(activeSession = session) {
    if (!activeSession) {
      setRole(null);
      setIssues([]);
      return false;
    }
    try {
      const { data, error } = await withTimeout(
        supabase.from("profiles").select("role, requested_role, role_approval_status").eq("id", activeSession.user.id).single(),
        "Your profile check is taking too long. Please check the Supabase project connection and try again."
      );
      if (error) {
        setRole(null);
        setMessage(`Your profile could not be loaded: ${error.message}`);
        return false;
      }

      setRole(data.role);
      if (data.requested_role === "admin" && data.role_approval_status === "pending") {
        setMessage("Your admin access request is pending superadmin approval. You can continue from your pending dashboard.");
        return false;
      }

      if (data.role !== "admin" && data.role !== "superadmin") {
        setMessage("This account is signed in, but it is not authorized for the admin workspace.");
        return false;
      }

      const nextIssues = await withTimeout(
        getAdminIssues(),
        "The moderation queue is taking too long to load. Please retry in a moment."
      );
      setIssues(nextIssues);
      setMessage(`${nextIssues.length} reports in the moderation queue.`);
      return true;
    } catch (error) {
      setRole(null);
      setMessage(error instanceof Error ? error.message : "Unable to load moderation queue.");
      return false;
    }
  }

  async function signIn() {
    if (!email.trim() || !password.trim()) {
      setMessage("Please enter both admin email and password.");
      return;
    }

    setBusy(true);
    setMessage("Signing in securely...");
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email: email.trim(), password }),
        "Sign-in is taking too long. Please check your internet connection, Supabase Auth settings, or try again."
      );

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data.session) {
        setMessage("Sign-in did not return a session. If email confirmation is enabled, verify the email and try again.");
        return;
      }

      setSession(data.session);
      setMessage("Checking admin permissions...");
      const loaded = await loadAdmin(data.session);
      if (!loaded) return;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() { await supabase.auth.signOut(); setRole(null); setIssues([]); }

  if (!session || (role !== "admin" && role !== "superadmin")) {
    return (
      <main className="container band max-w-xl mx-auto py-20 px-4">
        <div className="text-center mb-8">
          <ShieldAlert className="mx-auto text-primary mb-3" size={40} />
          <h1 className="text-3xl font-semibold text-foreground">Admin Workspace</h1>
          <p className="text-muted-foreground font-semibold mt-1">
            Review citizen reports, publish safe public pages, and manage local priority actions.
          </p>
        </div>

        {session && role !== "admin" && role !== "superadmin" ? (
          <div className="p-4 rounded-md border border-destructive/20 bg-destructive/10 text-destructive text-sm font-extrabold text-center">
            {message}
          </div>
        ) : (
          <section className="bg-card rounded-lg border border-border shadow-sm p-6 space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-extrabold text-foreground uppercase">Admin Email</label>
              <input
                className="w-full px-4 py-3 rounded-md border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground font-semibold text-sm transition-all"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@domain.com"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-extrabold text-foreground uppercase">Password</label>
              <input
                className="w-full px-4 py-3 rounded-md border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground font-semibold text-sm transition-all"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button
              className="w-full px-6 py-3.5 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-md shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-70"
              type="button"
              disabled={busy}
              onClick={signIn}
            >
              {busy ? "Signing in..." : "Sign in to Dashboard"}
            </button>
            <div
              className={`rounded-md border px-4 py-3 text-center text-xs font-extrabold ${
                message.toLowerCase().includes("too long") ||
                message.toLowerCase().includes("could not") ||
                message.toLowerCase().includes("unable") ||
                message.toLowerCase().includes("not authorized") ||
                message.toLowerCase().includes("please enter") ||
                message.toLowerCase().includes("did not return")
                  ? "border-destructive/20 bg-destructive/10 text-destructive"
                  : busy
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-border bg-muted text-muted-foreground"
              }`}
              role={busy ? "status" : "alert"}
            >
              {message}
            </div>
          </section>
        )}
      </main>
    );
  }

  const submittedCount = countByStatus(issues, "submitted");
  const reviewCount = countByStatus(issues, "under_review");
  const publicCount = issues.filter((issue) => issue.isPublic).length;
  const rejectedCount = issues.filter((issue) => ["rejected", "duplicate", "insufficient_information"].includes(issue.status)).length;
  const activeCount = issues.filter((issue) => !["resolved", "rejected", "duplicate", "insufficient_information"].includes(issue.status)).length;
  const publishedCount = countByStatus(issues, "published");
  const actionCount = issues.filter((issue) => ["assigned", "action_started", "action_taken", "action_recorded"].includes(issue.status)).length;
  const statusBars = [
    { label: "New", value: submittedCount, color: "bg-primary", detail: "Submitted reports waiting for triage" },
    { label: "Review", value: reviewCount, color: "bg-accent", detail: "Reports under admin review" },
    { label: "Public", value: publicCount, color: "bg-secondary", detail: "Visible public records" },
    { label: "Action", value: actionCount, color: "bg-sky-600", detail: "Assigned or action-stage reports" },
    { label: "Rejected", value: rejectedCount, color: "bg-destructive", detail: "Rejected, duplicate, or insufficient" }
  ];
  const maxStatusValue = Math.max(...statusBars.map((item) => item.value), 1);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleIssues = issues.filter((issue) => {
    const matchesFilter = filter === "all" || issue.status === filter;
    if (!matchesFilter) return false;
    if (!normalizedSearch) return true;

    return [
      issue.publicId,
      issue.title,
      issue.category,
      issue.customCategory,
      issue.status,
      issue.state,
      issue.district,
      issue.townVillage,
      issue.pincode,
      issue.summary
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });
  function exportVisibleIssues() {
    const header = ["Public ID", "Title", "Status", "Category", "Town/Village", "District", "State", "Pincode", "Reported At"];
    const rows = visibleIssues.map((issue) => [
      issue.publicId,
      issue.title,
      statusLabel(issue.status),
      statusLabel(issue.category),
      issue.townVillage,
      issue.district,
      issue.state,
      issue.pincode,
      issue.createdAt
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `iai-admin-reports-${filter}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-muted/40 text-foreground">
      <div className="flex min-h-screen overflow-hidden">
        <aside className="hidden w-[280px] shrink-0 flex-col border-r border-border bg-card p-6 lg:flex">
          <div className="mb-7 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
                <ShieldCheck size={19} />
              </span>
              <div>
                <p className="text-lg font-semibold">IAI Admin</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{role}</p>
              </div>
            </div>
            <button className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground" onClick={() => setModerationNotice({ tone: "info", title: "Sidebar ready", detail: "Use the status filters below to narrow the moderation queue." })} type="button">
              <Menu size={16} />
            </button>
          </div>

          <div className="space-y-1 border-t border-border pt-5">
            <AdminNavItem href="/admin" icon={<LayoutDashboard size={17} />} label="Dashboard" active />
            <AdminNavItem href="/admin/review-queue" icon={<ListChecks size={17} />} label="Review queue" badge={issues.length} />
            <AdminNavItem href="/records" icon={<FileText size={17} />} label="Public Records" badge={publicCount} />
            <AdminNavItem icon={<BarChart3 size={17} />} label="Analytics" />
          </div>

          <div className="mt-auto space-y-5">
            <div className="rounded-lg border border-border bg-muted p-5 text-foreground">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-card text-primary">
                <ShieldAlert size={17} />
              </span>
              <p className="mt-5 text-sm font-semibold">Moderation scope</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Review reports, publish safe records, and document public action.</p>
            </div>
            <button className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground" onClick={signOut} type="button">
              <X size={17} />
              Sign Out
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1 bg-muted/30">
          <header className="flex min-h-[76px] flex-col gap-4 border-b border-border bg-card px-5 py-4 md:flex-row md:items-center md:justify-between lg:px-8">
            <div className="flex items-center gap-3">
              <button className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-muted-foreground lg:hidden" onClick={() => setModerationNotice({ tone: "info", title: "Mobile dashboard", detail: "Use the filter dropdown and search field to navigate reports on smaller screens." })} type="button">
                <Menu size={20} />
              </button>
              <div className="relative w-full min-w-0 md:w-[330px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                <input
                  className="h-11 w-full rounded-md border border-border bg-card pl-11 pr-16 text-sm font-semibold text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search reports, IDs, places..."
                  value={searchTerm}
                />
                <span className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground sm:block">
                  Ctrl K
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition hover:border-accent hover:text-accent" onClick={() => void loadAdmin(session)} title="Refresh dashboard" type="button">
                <RefreshCw size={17} />
              </button>
              <button className="relative flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-muted-foreground" onClick={() => setModerationNotice({ tone: "info", title: "Dashboard alerts", detail: "The dashboard is showing loaded moderation counts and workflow health." })} type="button">
                <Bell size={17} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-md bg-primary" />
              </button>
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-foreground text-sm font-semibold text-primary-foreground">
                IAI
              </div>
            </div>
          </header>

          <div className="space-y-6 p-5 lg:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">India Against Injustice</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Moderation dashboard</h1>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm" onClick={() => setModerationNotice({ tone: "info", title: "All-time dashboard", detail: "The current dashboard uses all reports loaded from the admin moderation dataset." })} type="button">
                  All time
                </button>
                <select
                  className="rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm outline-none"
                  value={filter}
                  onChange={(event) => {
                    const next = event.target.value as "all" | IssueStatus;
                    setFilter(next);
                  }}
                >
                  <option value="all">All Reports</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>{statusLabel(status)}</option>
                  ))}
                </select>
                <button className="rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-sm transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50" disabled={visibleIssues.length === 0} onClick={exportVisibleIssues} type="button">
                  Export
                </button>
              </div>
            </div>

            {moderationNotice ? (
              <div
                className={`flex items-start justify-between gap-4 rounded-lg border p-4 shadow-sm ${
                  moderationNotice.tone === "success"
                    ? "border-secondary/20 bg-secondary/10 text-secondary"
                    : moderationNotice.tone === "error"
                      ? "border-destructive/20 bg-destructive/10 text-destructive"
                      : "border-primary/20 bg-primary/10 text-primary"
                }`}
                role={moderationNotice.tone === "error" ? "alert" : "status"}
              >
                <div className="flex gap-3">
                  {moderationNotice.tone === "success" ? (
                    <CheckCircle2 className="mt-0.5 shrink-0 text-secondary" size={20} />
                  ) : (
                    <AlertCircle className={`mt-0.5 shrink-0 ${moderationNotice.tone === "error" ? "text-destructive" : "text-primary"}`} size={20} />
                  )}
                  <div>
                    <p className="text-sm font-semibold">{moderationNotice.title}</p>
                    <p className="mt-1 text-sm font-semibold opacity-80">{moderationNotice.detail}</p>
                  </div>
                </div>
                <button className="rounded-md p-1 opacity-60 transition hover:bg-card/70 hover:opacity-100" onClick={() => setModerationNotice(null)} title="Dismiss message" type="button">
                  <X size={16} />
                </button>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <DashboardMetric icon={<FileText size={18} />} label="Total Reports" value={issues.length} detail={`${activeCount} active`} tone="blue" />
              <DashboardMetric icon={<Clock3 size={18} />} label="Needs Review" value={submittedCount + reviewCount} detail={`${submittedCount} new submissions`} tone="green" />
              <DashboardMetric icon={<AlertCircle size={18} />} label="Rejected" value={rejectedCount} detail="closed or duplicate" tone="rose" />
              <DashboardMetric icon={<CheckCircle2 size={18} />} label="Public Records" value={publicCount} detail={`${publishedCount} published`} tone="green" />
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-5">
                <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">Queue health</h2>
                      <p className="mt-1 text-sm text-muted-foreground">A compact view of where reports sit in the moderation workflow.</p>
                    </div>
                    <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {visibleIssues.length} visible
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    {statusBars.map((bar) => (
                      <StatusProgress
                        color={bar.color}
                        detail={bar.detail}
                        key={bar.label}
                        label={bar.label}
                        max={maxStatusValue}
                        value={bar.value}
                      />
                    ))}
                  </div>

                  <div className="mt-5 grid gap-3 border-t border-border pt-5 md:grid-cols-3">
                    <MiniProgress label="Submitted" value={submittedCount} tone="orange" />
                    <MiniProgress label="Needs review" value={submittedCount + reviewCount} tone="blue" />
                    <MiniProgress label="Action stage" value={actionCount} tone="green" />
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AdminNavItem({ href, icon, label, active = false, badge }: { href?: string; icon: ReactNode; label: string; active?: boolean; badge?: number }) {
  const className = `flex w-full items-center justify-between rounded-md px-4 py-3 text-sm font-medium transition ${
    active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
  }`;
  const content = (
    <>
      <span className="flex items-center gap-3">
        <span className={active ? "text-primary" : "text-muted-foreground"}>{icon}</span>
        {label}
      </span>
      {typeof badge === "number" ? (
        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{badge}</span>
      ) : active ? (
        <span className="h-2 w-2 rounded-md bg-primary" />
      ) : null}
    </>
  );

  return href ? (
    <Link className={className} href={href}>
      {content}
    </Link>
  ) : (
    <button className={className} type="button">
      {content}
    </button>
  );
}

function DashboardMetric({
  icon,
  label,
  value,
  detail,
  tone
}: {
  icon: ReactNode;
  label: string;
  value: number;
  detail: string;
  tone: "slate" | "orange" | "green" | "blue" | "rose";
}) {
  const tones = {
    slate: "bg-muted text-foreground",
    orange: "bg-primary/10 text-primary",
    green: "bg-secondary/10 text-secondary",
    blue: "bg-accent/10 text-accent",
    rose: "bg-destructive/10 text-destructive"
  };

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <span className={`flex h-12 w-12 items-center justify-center rounded-md ${tones[tone]}`}>{icon}</span>
        <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Live</span>
      </div>
      <p className="mt-5 text-sm font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <strong className="text-4xl font-semibold tracking-tight text-foreground">{value}</strong>
        <span className="text-right text-xs font-medium text-muted-foreground">{detail}</span>
      </div>
    </section>
  );
}

function StatusProgress({ label, detail, value, max, color }: { label: string; detail: string; value: number; max: number; color: string }) {
  const width = value === 0 ? 0 : Math.max(8, Math.round((value / Math.max(max, 1)) * 100));

  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium capitalize text-foreground">{label}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</p>
        </div>
        <span className="text-sm font-semibold text-foreground">{value}</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-md bg-muted">
        <span className={`block h-full rounded-md ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function MiniProgress({ label, value, tone }: { label: string; value: number; tone: "blue" | "green" | "orange" }) {
  const tones = {
    blue: "bg-accent",
    green: "bg-secondary",
    orange: "bg-primary"
  };

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-md bg-muted">
        <span className={`block h-full rounded-md ${tones[tone]}`} style={{ width: `${Math.min(100, Math.max(8, value * 18))}%` }} />
      </div>
    </div>
  );
}
