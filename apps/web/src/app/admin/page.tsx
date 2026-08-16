"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { IssueStatus } from "@citizens-first/shared";
import { addIssueUpdate, getAdminIssues, type AdminIssue, updateIssueModeration } from "@/lib/data";
import { supabase } from "@/lib/supabase";

const statuses: IssueStatus[] = ["submitted", "under_review", "published", "assigned", "action_recorded", "citizen_verified", "resolved", "rejected"];

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [issues, setIssues] = useState<AdminIssue[]>([]);
  const [selected, setSelected] = useState<AdminIssue | null>(null);
  const [filter, setFilter] = useState<"all" | IssueStatus>("all");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Admin access requires an account with the admin role.");
  const [busy, setBusy] = useState(false);

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
    if (data.role !== "admin") return setMessage("This account is not an admin account.");
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

  if (!session || role !== "admin") {
    return <main className="container band"><h1>Admin dashboard</h1><p className="muted">Review citizen reports, publish safe public pages and record authority action.</p>{session && role !== "admin" ? <p className="notice">{message}</p> : <section className="card form"><label className="field">Admin email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="field">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="button" type="button" disabled={busy} onClick={signIn}>{busy ? "Signing in..." : "Sign in"}</button><p className="notice">{message}</p></section>}</main>;
  }

  async function saveModeration(values: Parameters<typeof updateIssueModeration>[1]) {
    if (!selected) return;
    setBusy(true);
    try { await updateIssueModeration(selected.id, values); setMessage("Moderation decision saved."); await loadAdmin(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save moderation decision."); }
    finally { setBusy(false); }
  }

  return <main className="container band adminLayout">
    <div className="sectionHeader"><div><span className="status">Admin workspace</span><h1>Moderation queue</h1></div><button className="button secondary" type="button" onClick={signOut}>Sign out</button></div>
    <p className="notice">{message}</p>
    <div className="adminGrid">
      <section className="card queue"><label className="field">Filter<select value={filter} onChange={(event) => { const next = event.target.value as "all" | IssueStatus; setFilter(next); void loadAdmin(session, next); }}><option value="all">All reports</option>{statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label>{issues.map((issue) => <button className={`queueItem ${selected?.id === issue.id ? "queueItemActive" : ""}`} type="button" key={issue.id} onClick={() => setSelected(issue)}><span className="status">{issue.status.replaceAll("_", " ")}</span><strong>{issue.title}</strong><small>{issue.area} · {issue.publicId}</small></button>)}{issues.length === 0 ? <p className="muted">No reports in this filter.</p> : null}</section>
      {selected ? <ModerationForm issue={selected} busy={busy} onSave={saveModeration} /> : <section className="card"><h2>Select a report</h2><p className="muted">Choose a report from the queue to review its private details.</p></section>}
    </div>
  </main>;
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
    try { await addIssueUpdate(issue.id, updateType, updateBody, updatePublic); setUpdateBody(""); setUpdateMessage("Action update added."); }
    catch (error) { setUpdateMessage(error instanceof Error ? error.message : "Unable to add update."); }
  }

  return <section className="card form"><div><span className="status">{issue.publicId}</span><h2>{issue.title}</h2><p className="muted">{issue.area}, {issue.city} · {issue.category.replaceAll("_", " ")}</p></div><p>{issue.summary}</p><div className="privatePanel"><strong>Private reporter details</strong><p>Reporter ID: {issue.reporterId ?? "not available"}</p><p>Private address: {issue.privateAddress || "not provided"}</p><p>Coordinates: private until explicitly reviewed</p></div><label className="field">Workflow status<select value={status} onChange={(event) => setStatus(event.target.value as IssueStatus)}>{statuses.map((item) => <option value={item} key={item}>{item.replaceAll("_", " ")}</option>)}</select></label><label className="field">Authority name<input value={authorityName} onChange={(event) => setAuthorityName(event.target.value)} /></label><label className="field">Authority reference<input value={authorityReference} onChange={(event) => setAuthorityReference(event.target.value)} /></label><label className="field">Internal notes<textarea rows={3} value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} /></label><label className="field">Rejection reason<textarea rows={2} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} /></label><div className="checkList"><label><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} /> Public after review</label><label><input type="checkbox" checked={isSensitive} onChange={(event) => setIsSensitive(event.target.checked)} /> Sensitive report</label><label><input type="checkbox" checked={indexable} onChange={(event) => setIndexable(event.target.checked)} /> Allow search indexing</label></div><button className="button" type="button" disabled={busy} onClick={() => onSave({ status, isPublic, isSensitive, indexable, authorityName, authorityReference, internalNotes, rejectionReason })}>Save moderation decision</button><hr /><h3>Public action update</h3><label className="field">Update type<select value={updateType} onChange={(event) => setUpdateType(event.target.value)}><option value="authority_response">Authority response</option><option value="action_recorded">Action recorded</option><option value="citizen_verified">Citizen verified</option><option value="resolution">Resolution</option></select></label><label className="field">Update details<textarea rows={3} value={updateBody} onChange={(event) => setUpdateBody(event.target.value)} placeholder="What happened next?" /></label><label><input type="checkbox" checked={updatePublic} onChange={(event) => setUpdatePublic(event.target.checked)} /> Show on public issue page</label><button className="button secondary" type="button" onClick={addUpdate}>Add update</button>{updateMessage ? <p className="notice">{updateMessage}</p> : null}</section>;
}
