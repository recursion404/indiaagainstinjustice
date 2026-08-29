"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { IssueStatus } from "@citizens-first/shared";
import { addIssueUpdate, getAdminIssues, type AdminIssue, updateIssueModeration } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { AlertCircle, CheckCircle2, ShieldAlert, UserCheck, ShieldCheck, Mail, Search, Settings, X } from "lucide-react";

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

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [issues, setIssues] = useState<AdminIssue[]>([]);
  const [selected, setSelected] = useState<AdminIssue | null>(null);
  const [filter, setFilter] = useState<"all" | IssueStatus>("all");
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

  async function loadAdmin(activeSession = session, activeFilter = filter) {
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

      const nextIssues = await withTimeout(
        getAdminIssues(activeFilter === "all" ? undefined : activeFilter),
        "The moderation queue is taking too long to load. Please retry in a moment."
      );
      setIssues(nextIssues);
      setSelected((current) => current ? nextIssues.find((issue) => issue.id === current.id) ?? current : nextIssues[0] ?? null);
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
      const loaded = await loadAdmin(data.session, filter);
      if (!loaded) return;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() { await supabase.auth.signOut(); setRole(null); setIssues([]); setSelected(null); }

  async function promoteToAdmin() {
    if (!promoteEmail.trim()) return setPromoteMessage("Please enter an email address.");
    setPromoting(true);
    setPromoteMessage("");
    try {
      const { data: profile, error: findError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("email", promoteEmail.trim().toLowerCase())
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
      setPromoteMessage(`Successfully promoted ${promoteEmail} to Administrator.`);
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
          <ShieldAlert className="mx-auto text-orange-600 mb-3" size={40} />
          <h1 className="text-3xl font-black text-slate-950">Admin Workspace</h1>
          <p className="text-slate-500 font-semibold mt-1">
            Review citizen reports, publish safe public pages, and manage local priority actions.
          </p>
        </div>

        {session && role !== "admin" && role !== "superadmin" ? (
          <div className="p-4 rounded-xl border border-rose-100 bg-rose-50 text-rose-800 text-sm font-extrabold text-center">
            {message}
          </div>
        ) : (
          <section className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-extrabold text-slate-700 uppercase">Admin Email</label>
              <input
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 font-semibold text-sm transition-all"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@domain.com"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-extrabold text-slate-700 uppercase">Password</label>
              <input
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 font-semibold text-sm transition-all"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button
              className="w-full px-6 py-3.5 text-sm font-black text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 rounded-xl shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-70"
              type="button"
              disabled={busy}
              onClick={signIn}
            >
              {busy ? "Signing in..." : "Sign in to Dashboard"}
            </button>
            <div
              className={`rounded-xl border px-4 py-3 text-center text-xs font-extrabold ${
                message.toLowerCase().includes("too long") ||
                message.toLowerCase().includes("could not") ||
                message.toLowerCase().includes("unable") ||
                message.toLowerCase().includes("not authorized") ||
                message.toLowerCase().includes("please enter") ||
                message.toLowerCase().includes("did not return")
                  ? "border-rose-100 bg-rose-50 text-rose-800"
                  : busy
                    ? "border-orange-100 bg-orange-50 text-orange-800"
                    : "border-slate-100 bg-slate-50 text-slate-500"
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

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-700 border border-orange-100 uppercase tracking-widest mb-3">
            <ShieldCheck size={12} className="text-orange-600" /> Admin Workspace
          </span>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">
            Moderation Queue
          </h1>
          <p className="text-slate-500 font-semibold mt-1">
            Review detailed citizen reports, manage verification states, and assign resolving authorities.
          </p>
        </div>
        <button 
          className="px-5 py-2.5 text-xs font-black text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          type="button" 
          onClick={signOut}
        >
          Sign Out
        </button>
      </div>

      {moderationNotice ? (
        <div
          className={`flex items-start justify-between gap-4 rounded-2xl border p-4 shadow-sm ${
            moderationNotice.tone === "success"
              ? "border-emerald-100 bg-emerald-50 text-emerald-900"
              : moderationNotice.tone === "error"
                ? "border-rose-100 bg-rose-50 text-rose-900"
                : "border-orange-100 bg-orange-50 text-orange-900"
          }`}
          role={moderationNotice.tone === "error" ? "alert" : "status"}
        >
          <div className="flex gap-3">
            {moderationNotice.tone === "success" ? (
              <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} />
            ) : (
              <AlertCircle className={`mt-0.5 shrink-0 ${moderationNotice.tone === "error" ? "text-rose-600" : "text-orange-600"}`} size={20} />
            )}
            <div>
              <p className="text-sm font-black">{moderationNotice.title}</p>
              <p className="mt-1 text-sm font-semibold opacity-80">{moderationNotice.detail}</p>
            </div>
          </div>
          <button
            className="rounded-full p-1 opacity-60 transition hover:bg-white/70 hover:opacity-100"
            onClick={() => setModerationNotice(null)}
            title="Dismiss message"
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      {/* Superadmin Exclusive Management Controls */}
      {role === "superadmin" && (
        <section className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-900/5 p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Settings className="text-orange-600" size={18} />
            <div>
              <h2 className="text-lg font-black text-slate-900">Superadmin System Settings</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Authorize Community Administrators</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-end gap-4 max-w-2xl">
            <div className="flex flex-col gap-1.5 flex-1 w-full">
              <label className="text-xs font-extrabold text-slate-700 uppercase">Citizen Account Email</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 text-slate-400" size={16} />
                <input
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 font-semibold text-sm transition-all"
                  value={promoteEmail}
                  onChange={(event) => setPromoteEmail(event.target.value)}
                  placeholder="name@domain.com"
                />
              </div>
            </div>
            <button
              className="px-6 py-3 text-sm font-black text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 rounded-xl shadow-md transition-all whitespace-nowrap inline-flex items-center gap-2 w-full md:w-auto justify-center"
              type="button"
              disabled={promoting}
              onClick={promoteToAdmin}
            >
              <UserCheck size={16} /> {promoting ? "Promoting..." : "Promote to Admin"}
            </button>
          </div>

          {promoteMessage && (
            <div className={`p-4 rounded-xl border text-xs font-extrabold max-w-2xl ${
              promoteMessage.toLowerCase().includes("successfully") 
                ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                : "bg-rose-50 border-rose-100 text-rose-800"
            }`}>
              {promoteMessage}
            </div>
          )}
        </section>
      )}

      {/* Primary Moderation Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 flex flex-col gap-4 lg:col-span-1 h-fit">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-slate-700 uppercase">Filter by Workflow</label>
            <select 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm bg-white"
              value={filter} 
              onChange={(event) => { 
                const next = event.target.value as "all" | IssueStatus; 
                setFilter(next); 
                void loadAdmin(session, next); 
              }}
            >
              <option value="all">All reports</option>
              {statuses.map((status) => (
                <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {issues.map((issue) => (
              <button 
                className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-2 ${
                  selected?.id === issue.id 
                    ? "border-orange-500 bg-orange-50/10 shadow-md shadow-orange-950/2" 
                    : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"
                }`} 
                type="button" 
                key={issue.id} 
                onClick={() => setSelected(issue)}
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                    {issue.status.replaceAll("_", " ")}
                  </span>
                  <small className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    {issue.publicId}
                  </small>
                </div>
                <strong className="text-sm font-bold text-slate-900 line-clamp-1">
                  {issue.title}
                </strong>
                <small className="text-xs font-semibold text-slate-400">
                  {issue.townVillage}
                </small>
              </button>
            ))}

            {issues.length === 0 && (
              <p className="text-sm font-semibold text-slate-400 text-center py-8">
                No reports found in this filter.
              </p>
            )}
          </div>
        </section>

        {/* Selected Issue Moderation Editor Form */}
        <div className="lg:col-span-2">
          {selected ? (
            <ModerationForm issue={selected} busy={busy} onSave={saveModeration} />
          ) : (
            <section className="bg-white rounded-3xl border border-slate-100 shadow-xl p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
              <Search className="text-slate-300 mb-3" size={32} />
              <h2 className="text-lg font-bold text-slate-800">Select a report</h2>
              <p className="text-sm font-semibold text-slate-400 mt-1 max-w-sm">
                Choose an active report from the moderation queue on the left to review its private attributes and save decisions.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
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
    <section className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-50 text-orange-700 border border-orange-100 uppercase tracking-wider">
            {issue.publicId}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
            {issue.status.replaceAll("_", " ")}
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-950 tracking-tight leading-snug">
          {issue.title}
        </h2>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          {issue.townVillage}, {issue.district || issue.state} · {issue.category.replaceAll("_", " ")} · {issue.severity ?? "moderate"} severity · {issue.trafficCondition ?? "heavy"}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Public Description</h3>
          <p className="text-sm font-semibold text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100">{issue.summary}</p>
        </div>

        {issue.suggestedSolution && (
          <div>
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Citizen Suggested Solution</h3>
            <p className="text-sm font-semibold text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100">{issue.suggestedSolution}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Location details</h3>
            <div className="bg-slate-50/30 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-600 space-y-2">
              <p><span className="text-slate-400">Location:</span> {issue.locationName || issue.townVillage}</p>
              <p><span className="text-slate-400">Type:</span> {issue.locationKind ?? "area"}</p>
              <p><span className="text-slate-400">Citizen Wording:</span> {issue.citizenLandmark || "not provided"}</p>
              <p><span className="text-slate-400">Pincode:</span> {issue.pincode || "not provided"}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Private reporter details</h3>
            <div className="bg-rose-50/10 border border-rose-100/50 rounded-2xl p-4 text-xs font-bold text-slate-600 space-y-2">
              <p><span className="text-slate-400">Reporter ID:</span> {issue.reporterId ?? "not available"}</p>
              <p><span className="text-slate-400">Private address:</span> {issue.privateAddress || "not provided"}</p>
              <p className="text-[10px] text-rose-600 font-extrabold">🔒 Reporter coordinates and phone are hidden in the database view.</p>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Moderation Controls Form */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Moderation Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-slate-700 uppercase">Workflow Status</label>
            <select 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm bg-white"
              value={status} 
              onChange={(event) => setStatus(event.target.value as IssueStatus)}
            >
              {statuses.map((item) => (
                <option value={item} key={item}>{item.replaceAll("_", " ")}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-slate-700 uppercase">Authority Name</label>
            <input 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm"
              value={authorityName} 
              onChange={(event) => setAuthorityName(event.target.value)} 
              placeholder="e.g. Pune Municipal Corporation"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-slate-700 uppercase">Authority Reference Code</label>
            <input 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm"
              value={authorityReference} 
              onChange={(event) => setAuthorityReference(event.target.value)} 
              placeholder="e.g. PMC-2026-90432"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-slate-700 uppercase">Internal Notes (Private)</label>
            <textarea 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm"
              rows={2} 
              value={internalNotes} 
              onChange={(event) => setInternalNotes(event.target.value)} 
              placeholder="Add admin notes..."
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-extrabold text-slate-700 uppercase">Rejection / Postponement Reason</label>
          <textarea 
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm"
            rows={2} 
            value={rejectionReason} 
            onChange={(event) => setRejectionReason(event.target.value)} 
            placeholder="Reason visible to reporter if rejected..."
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4 py-3 bg-slate-50/50 rounded-2xl px-4 border border-slate-100 text-xs font-bold text-slate-700">
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
          className="w-full px-6 py-3 text-sm font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          type="button" 
          disabled={busy} 
          onClick={() => setConfirmOpen(true)}
        >
          {busy ? "Saving Decision..." : "Save Moderation Decision"}
        </button>
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="moderation-confirm-title">
          <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl shadow-slate-950/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-700">
                  Review before saving
                </span>
                <h3 id="moderation-confirm-title" className="mt-4 text-xl font-black text-slate-950">
                  Save this moderation decision?
                </h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
                  This will update the report workflow status and moderation settings for {issue.publicId}.
                </p>
              </div>
              <button
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setConfirmOpen(false)}
                title="Close confirmation"
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Current status</span>
                <strong className="text-right text-slate-900">{issue.status.replaceAll("_", " ")}</strong>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-slate-400">New status</span>
                <strong className="text-right text-orange-700">{status.replaceAll("_", " ")}</strong>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-slate-400">Public page</span>
                <strong className="text-right text-slate-900">{isPublic ? "Allowed after review" : "Hidden"}</strong>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-slate-400">Search indexing</span>
                <strong className="text-right text-slate-900">{indexable ? "Allowed" : "Blocked"}</strong>
              </div>
              {isSensitive ? (
                <p className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-extrabold text-rose-700">
                  Sensitive report is enabled. Please confirm public details are safe before saving.
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                onClick={() => setConfirmOpen(false)}
                type="button"
              >
                Review again
              </button>
              <button
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
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

      <hr className="border-slate-100" />

      {/* Public Action Timeline Updates */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Public Action Updates</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-slate-700 uppercase">Update Type</label>
            <select 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm bg-white"
              value={updateType} 
              onChange={(event) => setUpdateType(event.target.value)}
            >
              <option value="authority_response">Authority response</option>
              <option value="action_recorded">Action recorded</option>
              <option value="citizen_verified">Citizen verified</option>
              <option value="resolution">Resolution</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-6 text-xs font-bold text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={updatePublic} onChange={(event) => setUpdatePublic(event.target.checked)} /> 
              <span>Show on public issue page timeline</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-extrabold text-slate-700 uppercase">Update details</label>
          <textarea 
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm"
            rows={3} 
            value={updateBody} 
            onChange={(event) => setUpdateBody(event.target.value)} 
            placeholder="Describe what action was taken, comments from officers, etc..." 
          />
        </div>

        <button 
          className="px-6 py-2.5 text-xs font-black text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all cursor-pointer" 
          type="button" 
          onClick={addUpdate}
        >
          Add Public Update
        </button>

        {updateMessage && (
          <p className="text-xs font-black text-orange-600 bg-orange-50/50 px-4 py-2 rounded-lg border border-orange-100 w-fit">{updateMessage}</p>
        )}
      </div>
    </section>
  );
}
