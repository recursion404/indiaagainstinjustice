"use client";

import { type ReactNode, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { IssueStatus } from "@citizens-first/shared";
import { addIssueUpdate, getAdminIssues, getRecentIssueUpdates, type AdminIssue, type AdminIssueUpdate, updateIssueModeration } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import {
  AlertCircle,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock3,
  FileText,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Mail,
  Menu,
  MoreVertical,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
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

function formatShortDate(value: string | null) {
  if (!value) return "Not dated";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(new Date(value));
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
  const [recentUpdates, setRecentUpdates] = useState<AdminIssueUpdate[]>([]);
  const [selected, setSelected] = useState<AdminIssue | null>(null);
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

  // Superadmin States
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoteMessage, setPromoteMessage] = useState("");
  const [promoting, setPromoting] = useState(false);

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
        setSelected(null);
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
      setSelected(null);
      return false;
    }
    try {
      const { data, error } = await withTimeout(
        supabase.from("profiles").select("role").eq("id", activeSession.user.id).single(),
        "Your profile check is taking too long. Please check the Supabase project connection and try again."
      );
      if (error) {
        setRole(null);
        setMessage(`Your profile could not be loaded: ${error.message}`);
        return false;
      }

      setRole(data.role);
      if (data.role !== "admin" && data.role !== "superadmin") {
        setMessage("This account is signed in, but it is not authorized for the admin workspace.");
        return false;
      }

      const [nextIssues, nextUpdates] = await withTimeout(
        Promise.all([
          getAdminIssues(),
          getRecentIssueUpdates().catch(() => [])
        ]),
        "The moderation queue is taking too long to load. Please retry in a moment."
      );
      setIssues(nextIssues);
      setSelected((current) => current ? nextIssues.find((issue) => issue.id === current.id) ?? current : nextIssues[0] ?? null);
      setRecentUpdates(nextUpdates);
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

  async function signOut() { await supabase.auth.signOut(); setRole(null); setIssues([]); setSelected(null); }

  async function promoteToAdmin() {
    const normalizedEmail = promoteEmail.trim().toLowerCase();
    if (!normalizedEmail) return setPromoteMessage("Please enter an email address.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return setPromoteMessage("Please enter a valid email address.");

    setPromoting(true);
    setPromoteMessage("");
    try {
      const { data: profile, error: findError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (findError) throw findError;
      if (!profile) {
        setPromoteMessage("No registered citizen account found with this email.");
        return;
      }

      if (profile.role === "admin" || profile.role === "superadmin") {
        setPromoteMessage(`User is already an ${profile.role}.`);
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", profile.id);

      if (updateError) throw updateError;
      setPromoteMessage(`Successfully promoted ${normalizedEmail} to Administrator.`);
      setPromoteEmail("");
    } catch (error) {
      setPromoteMessage(error instanceof Error ? error.message : "Unable to promote user.");
    } finally {
      setPromoting(false);
    }
  }

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

  async function saveModeration(values: Parameters<typeof updateIssueModeration>[1]) {
    if (!selected) return;
    setBusy(true);
    setModerationNotice({
      tone: "info",
      title: "Saving moderation decision",
      detail: "Applying the workflow status and review settings now."
    });
    try {
      const savedIssue = await updateIssueModeration(selected.id, values);
      await loadAdmin();
      setModerationNotice({
        tone: "success",
        title: "Moderation decision saved",
        detail: `${savedIssue.publicId} is now marked as ${savedIssue.status.replaceAll("_", " ")}.`
      });
    }
    catch (error) {
      setModerationNotice({
        tone: "error",
        title: "Could not save moderation decision",
        detail: error instanceof Error ? error.message : "Something went wrong while saving this report."
      });
    }
    finally { setBusy(false); }
  }

  const submittedCount = countByStatus(issues, "submitted");
  const reviewCount = countByStatus(issues, "under_review");
  const publicCount = issues.filter((issue) => issue.isPublic).length;
  const rejectedCount = issues.filter((issue) => ["rejected", "duplicate", "insufficient_information"].includes(issue.status)).length;
  const activeCount = issues.filter((issue) => !["resolved", "rejected", "duplicate", "insufficient_information"].includes(issue.status)).length;
  const publishedCount = countByStatus(issues, "published");
  const actionCount = issues.filter((issue) => ["assigned", "action_started", "action_taken", "action_recorded"].includes(issue.status)).length;
  const statusBars = [
    { label: "New", value: submittedCount, color: "bg-primary" },
    { label: "Review", value: reviewCount, color: "bg-accent" },
    { label: "Public", value: publicCount, color: "bg-secondary" },
    { label: "Action", value: actionCount, color: "bg-sky-500" },
    { label: "Rejected", value: rejectedCount, color: "bg-destructive/100" }
  ];
  const maxStatusValue = Math.max(...statusBars.map((item) => item.value), 1);
  const publicConversion = issues.length ? Math.round((publicCount / issues.length) * 100) : 0;
  const activityCount = issues.length + recentUpdates.length;
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
  const mostActiveStage = statusBars.reduce((winner, item) => item.value > winner.value ? item : winner, statusBars[0]);

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
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7f0_0%,#ffffff_48%,#f0faf4_100%)] text-foreground">
      <div className="flex min-h-screen overflow-hidden bg-card">
        <aside className="hidden w-[260px] shrink-0 flex-col border-r border-border bg-card p-6 lg:flex">
          <div className="mb-7 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-primary-foreground ">
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
            <AdminNavItem icon={<LayoutDashboard size={17} />} label="Dashboard" active />
            <AdminNavItem icon={<ListChecks size={17} />} label="Moderation Queue" badge={issues.length} />
            <AdminNavItem icon={<FileText size={17} />} label="Public Records" badge={publicCount} />
            <AdminNavItem icon={<BarChart3 size={17} />} label="Analytics" />
            {role === "superadmin" ? <AdminNavItem icon={<Settings size={17} />} label="System Settings" /> : null}
          </div>

          <div className="mt-6 space-y-1 border-t border-border pt-5">
            {statuses.slice(0, 7).map((status) => (
              <button
                className={`flex w-full items-center justify-between rounded-md px-4 py-2.5 text-sm font-bold transition ${
                  filter === status ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
                key={status}
                onClick={() => {
                  setFilter(status);
                }}
                type="button"
              >
                <span className="capitalize">{statusLabel(status)}</span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{countByStatus(issues, status)}</span>
              </button>
            ))}
          </div>

          <div className="mt-auto space-y-5">
            <div className="rounded-lg bg-foreground p-5 text-background">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-card/15">
                <ShieldAlert size={17} />
              </span>
              <p className="mt-5 text-sm font-semibold">Admin controls</p>
              <p className="mt-1 text-xs font-medium leading-relaxed text-background/70">Moderate reports, publish public records, and manage civic accountability workflows.</p>
            </div>
            <button className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-sm font-bold text-muted-foreground hover:bg-muted" onClick={signOut} type="button">
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
                  placeholder="Search anything..."
                  value={searchTerm}
                />
                <span className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border px-2 py-1 text-[10px] font-semibold text-muted-foreground sm:block">
                  Ctrl K
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition hover:border-accent hover:text-accent" onClick={() => void loadAdmin(session)} title="Refresh dashboard" type="button">
                <RefreshCw size={17} />
              </button>
              <button className="relative flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-muted-foreground" onClick={() => setModerationNotice({ tone: "info", title: "Recent activity", detail: `${recentUpdates.length} recent public action updates are loaded in the activity widget.` })} type="button">
                <Bell size={17} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-md bg-primary" />
              </button>
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-foreground text-sm font-semibold text-primary-foreground">
                IAI
              </div>
            </div>
          </header>

          <div className="space-y-5 p-5 lg:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Dashboard</h1>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-md border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground" onClick={() => setModerationNotice({ tone: "info", title: "All-time dashboard", detail: "The current dashboard uses all reports loaded from the admin moderation dataset." })} type="button">
                  All time
                </button>
                <select
                  className="rounded-md border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground outline-none"
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
                <button className="rounded-md border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground" onClick={() => setModerationNotice({ tone: "info", title: "Dashboard widgets are active", detail: "The current cards, queue table, activity feed, and status widgets are already wired to live data." })} type="button">
                  Widgets ready
                </button>
                <button className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50" disabled={visibleIssues.length === 0} onClick={exportVisibleIssues} type="button">
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

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
              <div className="space-y-5">
                <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">Moderation Activity</h2>
                      <p className="mt-1 text-sm font-semibold text-muted-foreground">Workflow movement for public accountability records.</p>
                    </div>
                    <MoreVertical className="text-muted-foreground" size={19} />
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="flex flex-col justify-center">
                      <p className="text-4xl font-semibold">{activityCount}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="rounded-md bg-secondary/10 px-2.5 py-1 text-xs font-medium text-secondary">+{publicConversion}%</span>
                        <span className="text-xs font-semibold text-muted-foreground">reports and updates tracked</span>
                      </div>
                    </div>
                    <div className="relative h-44 overflow-hidden rounded-md bg-muted/40">
                      <svg className="h-full w-full" viewBox="0 0 600 190" preserveAspectRatio="none" aria-hidden="true">
                        <path d="M0 140 C70 130 80 160 140 118 C190 82 220 95 260 106 C315 123 350 68 410 92 C470 116 500 46 600 58" fill="none" stroke="#06038D" strokeWidth="5" />
                        <path d="M0 140 C70 130 80 160 140 118 C190 82 220 95 260 106 C315 123 350 68 410 92 C470 116 500 46 600 58 L600 190 L0 190 Z" fill="url(#chartFill)" opacity="0.35" />
                        <defs>
                          <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                            <stop stopColor="#06038D" />
                            <stop offset="1" stopColor="#ffffff" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute left-[58%] top-12 rounded-md border border-border bg-card px-4 py-3 text-xs font-bold text-foreground shadow-sm">
                        <p className="font-semibold">Today</p>
                        <p className="mt-1 text-accent">{publicCount} public records</p>
                        <p className="text-muted-foreground">{activeCount} active reports</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 border-t border-border pt-5 md:grid-cols-3">
                    <MiniProgress label="Submitted" value={submittedCount} tone="blue" />
                    <MiniProgress label="In review" value={reviewCount} tone="green" />
                    <MiniProgress label="Action stage" value={actionCount} tone="orange" />
                  </div>
                </section>

                <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">Moderation Queue</h2>
                      <p className="mt-1 text-sm font-semibold text-muted-foreground">{visibleIssues.length} visible of {issues.length} reports</p>
                    </div>
                    <button className="rounded-md border border-border px-4 py-2 text-sm font-bold text-foreground" onClick={() => void loadAdmin(session)} type="button">
                      Refresh
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left">
                      <thead>
                        <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                          <th className="py-3 pr-4">ID</th>
                          <th className="py-3 pr-4">Issue</th>
                          <th className="py-3 pr-4">Status</th>
                          <th className="py-3 pr-4">Location</th>
                          <th className="py-3 pr-4">Reported</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {visibleIssues.map((issue) => (
                          <tr
                            className={`cursor-pointer transition hover:bg-muted ${selected?.id === issue.id ? "bg-accent/50" : ""}`}
                            key={issue.id}
                            onClick={() => setSelected(issue)}
                          >
                            <td className="py-4 pr-4 text-sm font-bold text-muted-foreground">{issue.publicId}</td>
                            <td className="max-w-[260px] py-4 pr-4">
                              <p className="truncate text-sm font-semibold text-foreground">{issue.title}</p>
                              <p className="mt-1 truncate text-xs font-semibold capitalize text-muted-foreground">{statusLabel(issue.category)}</p>
                            </td>
                            <td className="py-4 pr-4">
                              <span className="rounded-md bg-muted px-3 py-1 text-xs font-semibold capitalize text-foreground">{statusLabel(issue.status)}</span>
                            </td>
                            <td className="py-4 pr-4 text-sm font-semibold text-muted-foreground">{issue.townVillage}</td>
                            <td className="py-4 pr-4 text-sm font-semibold text-muted-foreground">{formatShortDate(issue.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {visibleIssues.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border bg-muted px-5 py-10 text-center">
                      <Search className="mx-auto text-muted-foreground" size={30} />
                      <p className="mt-3 text-sm font-semibold text-foreground">No reports found</p>
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">Try changing the workflow filter or search term.</p>
                    </div>
                  ) : null}
                </section>
              </div>

              <div className="space-y-5">
                <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Most Active Stage</h2>
                    <MoreVertical className="text-muted-foreground" size={18} />
                  </div>
                  <div className="flex h-36 items-end justify-between gap-3">
                    {statusBars.map((bar) => (
                      <div className="flex flex-1 flex-col items-center gap-2" key={bar.label}>
                        <div className="flex h-24 w-full items-end justify-center rounded-md bg-muted">
                          <span className={`w-9 rounded-md ${bar.color}`} style={{ height: `${Math.max(18, (bar.value / maxStatusValue) * 100)}%` }} />
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground">{bar.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-center text-sm font-bold text-muted-foreground">
                    {mostActiveStage.label} leads with {mostActiveStage.value} reports.
                  </p>
                </section>

                <section className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
                  <div className="mb-2 flex items-center justify-between text-left">
                    <h2 className="text-lg font-semibold">Public Record Rate</h2>
                    <MoreVertical className="text-muted-foreground" size={18} />
                  </div>
                  <div className="mx-auto mt-4 flex h-40 w-56 items-end justify-center overflow-hidden rounded-t-full border-[18px] border-b-0 border-border">
                    <div className="mb-[-18px] flex h-32 w-44 items-center justify-center rounded-t-full border-[18px] border-b-0 border-secondary">
                      <span className="mb-3 text-4xl font-semibold">{publicConversion}%</span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-muted-foreground">On track for public transparency goals</p>
                </section>

                <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Recent Activity</h2>
                    <MoreVertical className="text-muted-foreground" size={18} />
                  </div>
                  <div className="space-y-3">
                    {recentUpdates.length > 0 ? (
                      recentUpdates.slice(0, 4).map((update) => (
                        <div className="rounded-md border border-border bg-muted p-3" key={update.id}>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-accent">{statusLabel(update.updateType)}</span>
                            <span className="text-[10px] font-bold text-muted-foreground">{formatShortDate(update.createdAt)}</span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs font-semibold leading-relaxed text-muted-foreground">{update.body}</p>
                          <p className="mt-2 truncate text-[10px] font-semibold text-muted-foreground">{update.publicId ?? "Private update"} · {update.issueTitle ?? "Report"}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-md border border-dashed border-border bg-muted px-4 py-8 text-center">
                        <p className="text-sm font-semibold text-foreground">No recent updates</p>
                        <p className="mt-1 text-xs font-semibold text-muted-foreground">Public action updates will appear here.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>

            {role === "superadmin" ? (
              <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-md bg-accent/10 text-accent">
                    <Settings size={20} />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Superadmin Controls</h2>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Authorize community administrators</p>
                  </div>
                </div>

                <div className="flex max-w-3xl flex-col gap-4 md:flex-row md:items-end">
                  <div className="flex w-full flex-1 flex-col gap-1.5">
                    <label className="text-xs font-extrabold uppercase text-foreground">Citizen Account Email</label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-4 text-muted-foreground" size={16} />
                      <input
                        className="w-full rounded-md border border-border py-3 pl-12 pr-4 text-sm font-semibold text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                        value={promoteEmail}
                        onChange={(event) => setPromoteEmail(event.target.value)}
                        placeholder="name@domain.com"
                      />
                    </div>
                  </div>
                  <button
                    className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md bg-accent px-6 py-3 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
                    type="button"
                    disabled={promoting}
                    onClick={promoteToAdmin}
                  >
                    <UserCheck size={16} /> {promoting ? "Promoting..." : "Promote to Admin"}
                  </button>
                </div>

                {promoteMessage ? (
                  <div className={`mt-4 max-w-3xl rounded-md border p-4 text-xs font-extrabold ${
                    promoteMessage.toLowerCase().includes("successfully")
                      ? "border-secondary/20 bg-secondary/10 text-secondary"
                      : "border-destructive/20 bg-destructive/10 text-destructive"
                  }`}>
                    {promoteMessage}
                  </div>
                ) : null}
              </section>
            ) : null}

            {selected ? (
              <ModerationForm issue={selected} busy={busy} onSave={saveModeration} />
            ) : (
              <section className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-border bg-card p-10 text-center shadow-sm">
                <Search className="mb-3 text-muted-foreground" size={32} />
                <h2 className="text-lg font-bold text-foreground">Select a report</h2>
                <p className="mt-1 max-w-sm text-sm font-semibold text-muted-foreground">Choose a report from the moderation queue to review private attributes and save decisions.</p>
              </section>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function AdminNavItem({ icon, label, active = false, badge }: { icon: ReactNode; label: string; active?: boolean; badge?: number }) {
  return (
    <button
      className={`flex w-full items-center justify-between rounded-md px-4 py-3 text-sm font-semibold transition ${
        active ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
      type="button"
    >
      <span className="flex items-center gap-3">
        <span className={active ? "text-accent" : "text-muted-foreground"}>{icon}</span>
        {label}
      </span>
      {typeof badge === "number" ? (
        <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary">{badge}</span>
      ) : active ? (
        <span className="h-2 w-2 rounded-md bg-accent" />
      ) : null}
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
    <section className="rounded-lg border border-border bg-card p-5 ">
      <div className="flex items-start justify-between gap-4">
        <span className={`flex h-12 w-12 items-center justify-center rounded-md ${tones[tone]}`}>{icon}</span>
        <span className="rounded-md bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Live</span>
      </div>
      <p className="mt-5 text-sm font-bold text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <strong className="text-4xl font-semibold tracking-tight text-foreground">{value}</strong>
        <span className="text-right text-xs font-extrabold text-muted-foreground">{detail}</span>
      </div>
    </section>
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
      <p className="mt-1 text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-md bg-muted">
        <span className={`block h-full rounded-md ${tones[tone]}`} style={{ width: `${Math.min(100, Math.max(8, value * 18))}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ModerationForm({ issue, busy, onSave }: { issue: AdminIssue; busy: boolean; onSave: (values: Parameters<typeof updateIssueModeration>[1]) => Promise<void> }) {
  const [status, setStatus] = useState<IssueStatus>(issue.status);
  const [isPublic, setIsPublic] = useState(issue.isPublic);
  const [isSensitive, setIsSensitive] = useState(issue.isSensitive);
  const [indexable, setIndexable] = useState(issue.indexable);
  const [authorityName, setAuthorityName] = useState(issue.authorityName ?? "");
  const [authorityReference, setAuthorityReference] = useState(issue.authorityReference ?? "");
  const [internalNotes, setInternalNotes] = useState(issue.internalNotes ?? "");
  const [rejectionReason, setRejectionReason] = useState(issue.rejectionReason ?? "");
  const [updateType, setUpdateType] = useState("authority_response");
  const [updateBody, setUpdateBody] = useState("");
  const [updatePublic, setUpdatePublic] = useState(true);
  const [updateMessage, setUpdateMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const moderationValues = {
    status,
    isPublic,
    isSensitive,
    indexable,
    authorityName,
    authorityReference,
    internalNotes,
    rejectionReason,
  };

  async function addUpdate() {
    if (!updateBody.trim()) return;
    try {
      await addIssueUpdate(issue.id, updateType, updateBody, updatePublic);
      setUpdateBody("");
      setUpdateMessage("Action update added successfully.");
    } catch (error) {
      setUpdateMessage(error instanceof Error ? error.message : "Unable to add update.");
    }
  }

  return (
    <section className="bg-card rounded-lg border border-border shadow-sm p-8 space-y-6">
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-semibold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
            {issue.publicId}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-semibold bg-accent/10 text-accent border border-accent uppercase tracking-wider">
            {issue.status.replaceAll("_", " ")}
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-foreground tracking-tight leading-snug">
          {issue.title}
        </h2>
        <p className="text-xs font-semibold text-muted-foreground mt-1">
          {issue.townVillage}, {issue.district || issue.state} · {issue.category.replaceAll("_", " ")} · {issue.severity ?? "moderate"} severity · {issue.trafficCondition ?? "heavy"}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-1.5">Public Description</h3>
          <p className="text-sm font-semibold text-foreground leading-relaxed bg-muted/50 p-4 rounded-md border border-border">{issue.summary}</p>
        </div>

        {issue.suggestedSolution && (
          <div>
            <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-1.5">Citizen Suggested Solution</h3>
            <p className="text-sm font-semibold text-foreground leading-relaxed bg-muted/50 p-4 rounded-md border border-border">{issue.suggestedSolution}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-1.5">Location details</h3>
            <div className="bg-muted/30 border border-border rounded-md p-4 text-xs font-bold text-muted-foreground space-y-2">
              <p><span className="text-muted-foreground">Location:</span> {issue.locationName || issue.townVillage}</p>
              <p><span className="text-muted-foreground">Type:</span> {issue.locationKind ?? "area"}</p>
              <p><span className="text-muted-foreground">Citizen Wording:</span> {issue.citizenLandmark || "not provided"}</p>
              <p><span className="text-muted-foreground">Pincode:</span> {issue.pincode || "not provided"}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-1.5">Private reporter details</h3>
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 text-xs font-bold text-muted-foreground space-y-2">
              <p><span className="text-muted-foreground">Reporter ID:</span> {issue.reporterId ?? "not available"}</p>
              <p><span className="text-muted-foreground">Private address:</span> {issue.privateAddress || "not provided"}</p>
              <p className="text-[10px] font-extrabold text-destructive">Private reporter coordinates and phone are hidden in the database view.</p>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-border" />

      {/* Moderation Controls Form */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Moderation Actions</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-foreground uppercase">Workflow Status</label>
            <select
              className="w-full px-4 py-2.5 rounded-md border border-border outline-none text-foreground font-semibold text-sm bg-card"
              value={status}
              onChange={(event) => setStatus(event.target.value as IssueStatus)}
            >
              {statuses.map((item) => (
                <option value={item} key={item}>{item.replaceAll("_", " ")}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-foreground uppercase">Authority Name</label>
            <input
              className="w-full px-4 py-2.5 rounded-md border border-border outline-none text-foreground font-semibold text-sm"
              value={authorityName}
              onChange={(event) => setAuthorityName(event.target.value)}
              placeholder="e.g. Pune Municipal Corporation"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-foreground uppercase">Authority Reference Code</label>
            <input
              className="w-full px-4 py-2.5 rounded-md border border-border outline-none text-foreground font-semibold text-sm"
              value={authorityReference}
              onChange={(event) => setAuthorityReference(event.target.value)}
              placeholder="e.g. PMC-2026-90432"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-foreground uppercase">Internal Notes (Private)</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-md border border-border outline-none text-foreground font-semibold text-sm"
              rows={2}
              value={internalNotes}
              onChange={(event) => setInternalNotes(event.target.value)}
              placeholder="Add admin notes..."
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-extrabold text-foreground uppercase">Rejection / Postponement Reason</label>
          <textarea
            className="w-full px-4 py-2.5 rounded-md border border-border outline-none text-foreground font-semibold text-sm"
            rows={2}
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            placeholder="Reason visible to reporter if rejected..."
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4 py-3 bg-muted/50 rounded-md px-4 border border-border text-xs font-bold text-foreground">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />
            <span>Public after review</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isSensitive} onChange={(event) => setIsSensitive(event.target.checked)} />
            <span>Sensitive report</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={indexable} onChange={(event) => setIndexable(event.target.checked)} />
            <span>Allow Search Engine Indexing</span>
          </label>
        </div>

        <button
          className="w-full px-6 py-3 text-sm font-semibold text-background bg-foreground hover:bg-foreground/90 rounded-md  transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          disabled={busy}
          onClick={() => setConfirmOpen(true)}
        >
          {busy ? "Saving Decision..." : "Save Moderation Decision"}
        </button>
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="moderation-confirm-title">
          <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 ">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
                  Review before saving
                </span>
                <h3 id="moderation-confirm-title" className="mt-4 text-xl font-semibold text-foreground">
                  Save this moderation decision?
                </h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">
                  This will update the report workflow status and moderation settings for {issue.publicId}.
                </p>
              </div>
              <button
                className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                onClick={() => setConfirmOpen(false)}
                title="Close confirmation"
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 rounded-md border border-border bg-muted p-4 text-sm font-semibold text-foreground">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Current status</span>
                <strong className="text-right text-foreground">{issue.status.replaceAll("_", " ")}</strong>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-muted-foreground">New status</span>
                <strong className="text-right text-primary">{status.replaceAll("_", " ")}</strong>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Public page</span>
                <strong className="text-right text-foreground">{isPublic ? "Allowed after review" : "Hidden"}</strong>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Search indexing</span>
                <strong className="text-right text-foreground">{indexable ? "Allowed" : "Blocked"}</strong>
              </div>
              {isSensitive ? (
                <p className="mt-4 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-extrabold text-destructive">
                  Sensitive report is enabled. Please confirm public details are safe before saving.
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
                onClick={() => setConfirmOpen(false)}
                type="button"
              >
                Review again
              </button>
              <button
                className="rounded-md bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-sm transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busy}
                onClick={async () => {
                  setConfirmOpen(false);
                  await onSave(moderationValues);
                }}
                type="button"
              >
                Confirm and save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <hr className="border-border" />

      {/* Public Action Timeline Updates */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Public Action Updates</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-foreground uppercase">Update Type</label>
            <select
              className="w-full px-4 py-2.5 rounded-md border border-border outline-none text-foreground font-semibold text-sm bg-card"
              value={updateType}
              onChange={(event) => setUpdateType(event.target.value)}
            >
              <option value="authority_response">Authority response</option>
              <option value="action_recorded">Action recorded</option>
              <option value="citizen_verified">Citizen verified</option>
              <option value="resolution">Resolution</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-6 text-xs font-bold text-foreground">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={updatePublic} onChange={(event) => setUpdatePublic(event.target.checked)} />
              <span>Show on public issue page timeline</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-extrabold text-foreground uppercase">Update details</label>
          <textarea
            className="w-full px-4 py-2.5 rounded-md border border-border outline-none text-foreground font-semibold text-sm"
            rows={3}
            value={updateBody}
            onChange={(event) => setUpdateBody(event.target.value)}
            placeholder="Describe what action was taken, comments from officers, etc..."
          />
        </div>

        <button
          className="px-6 py-2.5 text-xs font-semibold text-foreground bg-muted hover:bg-muted border border-border rounded-md transition-all cursor-pointer"
          type="button"
          onClick={addUpdate}
        >
          Add Public Update
        </button>

        {updateMessage && (
          <p className="text-xs font-semibold text-primary bg-primary/10 px-4 py-2 rounded-md border border-primary/20 w-fit">{updateMessage}</p>
        )}
      </div>
    </section>
  );
}
