"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { IssueStatus } from "@citizens-first/shared";
import { addIssueUpdate, getAdminIssues, type AdminIssue, updateIssueModeration } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { ShieldAlert, UserCheck, ShieldCheck, Mail, Search, ArrowRight, Settings } from "lucide-react";

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

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [issues, setIssues] = useState<AdminIssue[]>([]);
  const [selected, setSelected] = useState<AdminIssue | null>(null);
  const [filter, setFilter] = useState<"all" | IssueStatus>("all");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Admin access requires an authorized account.");
  const [busy, setBusy] = useState(false);

  // Superadmin States
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoteMessage, setPromoteMessage] = useState("");
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (data.session) void loadAdmin(data.session); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); if (nextSession) void loadAdmin(nextSession); });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadAdmin(activeSession = session, activeFilter = filter) {
    if (!activeSession) return;
    const { data, error } = await supabase.from("profiles").select("role").eq("id", activeSession.user.id).single();
    if (error) return setMessage("Your profile could not be loaded.");
    setRole(data.role);
    if (data.role !== "admin" && data.role !== "superadmin") return setMessage("This account is not authorized.");
    try {
      const nextIssues = await getAdminIssues(activeFilter === "all" ? undefined : activeFilter);
      setIssues(nextIssues);
      setSelected((current) => current ? nextIssues.find((issue) => issue.id === current.id) ?? current : nextIssues[0] ?? null);
      setMessage(`${nextIssues.length} reports in the moderation queue.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load moderation queue."); }
  }

  async function signIn() {
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setMessage(error.message);
    else await loadAdmin(data.session, filter);
    setBusy(false);
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
              className="w-full px-6 py-3.5 text-sm font-black text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 rounded-xl shadow-lg transition-all"
              type="button"
              disabled={busy}
              onClick={signIn}
            >
              {busy ? "Signing in..." : "Sign in to Dashboard"}
            </button>
            <p className="text-xs font-bold text-center text-slate-400 mt-2">{message}</p>
          </section>
        )}
      </main>
    );
  }

  async function saveModeration(values: Parameters<typeof updateIssueModeration>[1]) {
    if (!selected) return;
    setBusy(true);
    try { await updateIssueModeration(selected.id, values); setMessage("Moderation decision saved."); await loadAdmin(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save moderation decision."); }
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

function ModerationForm({ issue, busy, onSave }: { issue: AdminIssue; busy: boolean; onSave: (values: Parameters<typeof updateIssueModeration>[1]) => void }) {
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
          className="w-full px-6 py-3 text-sm font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-all cursor-pointer" 
          type="button" 
          disabled={busy} 
          onClick={() => onSave({ status, isPublic, isSensitive, indexable, authorityName, authorityReference, internalNotes, rejectionReason })}
        >
          Save Moderation Decision
        </button>
      </div>

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
