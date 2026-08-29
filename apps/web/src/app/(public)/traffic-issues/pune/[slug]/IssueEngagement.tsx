"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

function buildShareUrls(issueTitle: string) {
  if (typeof window === "undefined") return { url: "", fb: "", x: "", li: "" };
  const url = window.location.href;
  const msg = `🚦 ${issueTitle} – Help Pune fix this traffic issue. Report it on Citizens First Pune!`;
  return {
    url,
    fb: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(msg)}`,
    li: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  };
}

export function IssueEngagement({
  issueId,
  issueTitle,
  initialSupportCount,
  initialShareCount,
  initialConfirmationCount,
  initialNotObservedCount
}: {
  issueId: string;
  issueTitle: string;
  initialSupportCount: number;
  initialShareCount: number;
  initialConfirmationCount: number;
  initialNotObservedCount: number;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [supported, setSupported] = useState(false);
  const [shared, setShared] = useState(false);
  const [confirmation, setConfirmation] = useState<boolean | null>(null);
  const [supportCount, setSupportCount] = useState(initialSupportCount);
  const [shareCount, setShareCount] = useState(initialShareCount);
  const [confirmationCount, setConfirmationCount] = useState(initialConfirmationCount);
  const [notObservedCount, setNotObservedCount] = useState(initialNotObservedCount);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) {
        const [support, share] = await Promise.all([
          supabase.from("issue_supports").select("issue_id").eq("issue_id", issueId).eq("user_id", data.session.user.id).maybeSingle(),
          supabase.from("issue_share_events").select("issue_id").eq("issue_id", issueId).eq("user_id", data.session.user.id).maybeSingle()
        ]);
        const observation = await supabase.from("issue_confirmations").select("observed").eq("issue_id", issueId).eq("user_id", data.session.user.id).maybeSingle();
        setSupported(Boolean(support.data));
        setShared(Boolean(share.data));
        setConfirmation(typeof observation.data?.observed === "boolean" ? observation.data.observed : null);
      }
    });
  }, [issueId]);

  async function toggleUpvote() {
    if (!session) return setMessage("Sign in on the report page to upvote this issue.");
    if (supported) {
      const { error } = await supabase.from("issue_supports").delete().eq("issue_id", issueId).eq("user_id", session.user.id);
      if (error) setMessage(error.message); else { setSupported(false); setSupportCount((v) => Math.max(v - 1, 0)); }
    } else {
      const { error } = await supabase.from("issue_supports").insert({ issue_id: issueId, user_id: session.user.id });
      if (error) setMessage(error.code === "23505" ? "You already upvoted this issue." : error.message);
      else { setSupported(true); setSupportCount((v) => v + 1); }
    }
  }

  async function recordShare() {
    if (shared) return;
    if (!session) return;
    const { error } = await supabase.from("issue_share_events").insert({ issue_id: issueId, user_id: session.user.id, channel: "website_share" });
    if (!error) { setShared(true); setShareCount((v) => v + 1); }
  }

  function openShare(platform: "fb" | "x" | "li") {
    const { fb, x, li } = buildShareUrls(issueTitle);
    const urls = { fb, x, li };
    window.open(urls[platform], "_blank", "noopener,noreferrer,width=600,height=500");
    void recordShare();
    setMessage("Thanks for spreading the word!");
  }

  async function confirmIssue(observed: boolean) {
    if (!session) return setMessage("Sign in on the report page to confirm this issue.");
    const previous = confirmation;
    const { error } = await supabase.from("issue_confirmations").upsert({ issue_id: issueId, user_id: session.user.id, observed }, { onConflict: "issue_id,user_id" });
    if (error) return setMessage(error.message);
    setConfirmation(observed);
    if (observed && previous !== true) setConfirmationCount((v) => v + 1);
    if (!observed && previous === true) setConfirmationCount((v) => Math.max(v - 1, 0));
    if (!observed && previous !== false) setNotObservedCount((v) => v + 1);
    if (observed && previous === false) setNotObservedCount((v) => Math.max(v - 1, 0));
    setMessage(observed ? "Issue confirmed." : "Marked as not observed.");
  }

  return (
    <div className="engagement">
      <div className="stats">
        <div className="stat"><strong>{supportCount}</strong><span>upvotes</span></div>
        <div className="stat"><strong>{shareCount}</strong><span>social shares</span></div>
        <div className="stat"><strong>{confirmationCount}</strong><span>confirmed</span></div>
        <div className="stat"><strong>{notObservedCount}</strong><span>not observed</span></div>
      </div>
      <div className="actions">
        <button className="button" type="button" onClick={toggleUpvote}>
          {supported ? "Upvoted ▲" : "Upvote ▲"}
        </button>
        <button
          className={`button secondary${confirmation === true ? " active" : ""}`}
          type="button"
          onClick={() => confirmIssue(true)}
        >
          {confirmation === true ? "Confirmed ✓" : "Confirm issue"}
        </button>
        <button
          className={`button secondary${confirmation === false ? " active" : ""}`}
          type="button"
          onClick={() => confirmIssue(false)}
        >
          Not observed
        </button>
      </div>
      <div className="actions">
        <span className="muted" style={{ fontSize: "0.875rem", alignSelf: "center" }}>Share:</span>
        <button className="button secondary" type="button" onClick={() => openShare("fb")} title="Share on Facebook">
          Facebook
        </button>
        <button className="button secondary" type="button" onClick={() => openShare("x")} title="Share on X / Twitter">
          X (Twitter)
        </button>
        <button className="button secondary" type="button" onClick={() => openShare("li")} title="Share on LinkedIn">
          LinkedIn
        </button>
      </div>
      {message ? <p className="notice">{message}</p> : null}
    </div>
  );
}
