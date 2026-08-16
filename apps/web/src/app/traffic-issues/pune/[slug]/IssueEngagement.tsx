"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function IssueEngagement({ issueId, initialSupportCount, initialShareCount }: { issueId: string; initialSupportCount: number; initialShareCount: number }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supported, setSupported] = useState(false);
  const [shared, setShared] = useState(false);
  const [supportCount, setSupportCount] = useState(initialSupportCount);
  const [shareCount, setShareCount] = useState(initialShareCount);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) {
        const [support, share] = await Promise.all([
          supabase.from("issue_supports").select("issue_id").eq("issue_id", issueId).eq("user_id", data.session.user.id).maybeSingle(),
          supabase.from("issue_share_events").select("issue_id").eq("issue_id", issueId).eq("user_id", data.session.user.id).maybeSingle()
        ]);
        setSupported(Boolean(support.data));
        setShared(Boolean(share.data));
      }
    });
  }, [issueId]);

  async function toggleSupport() {
    if (!session) return setMessage("Sign in on the report page to support this issue.");
    if (supported) {
      const { error } = await supabase.from("issue_supports").delete().eq("issue_id", issueId).eq("user_id", session.user.id);
      if (error) setMessage(error.message); else { setSupported(false); setSupportCount((value) => Math.max(value - 1, 0)); }
    } else {
      const { error } = await supabase.from("issue_supports").insert({ issue_id: issueId, user_id: session.user.id });
      if (error) setMessage(error.code === "23505" ? "You already support this issue." : error.message); else { setSupported(true); setSupportCount((value) => value + 1); }
    }
  }

  async function shareIssue() {
    if (!session) return setMessage("Sign in on the report page to share this issue.");
    if (shared) return setMessage("You have already shared this issue.");
    if (navigator.share) await navigator.share({ title: "Citizens First Pune issue", text: window.location.href });
    const { error } = await supabase.from("issue_share_events").insert({ issue_id: issueId, user_id: session.user.id, channel: "website_share" });
    if (error) setMessage(error.code === "23505" ? "You have already shared this issue." : error.message); else { setShared(true); setShareCount((value) => value + 1); setMessage("Issue shared."); }
  }

  return <div className="engagement"><div className="stats"><div className="stat"><strong>{supportCount}</strong><span>citizen supports</span></div><div className="stat"><strong>{shareCount}</strong><span>social shares</span></div></div><div className="actions"><button className="button" type="button" onClick={toggleSupport}>{supported ? "Supported" : "Support this issue"}</button><button className="button secondary" type="button" onClick={shareIssue}>{shared ? "Shared" : "Share issue"}</button></div>{message ? <p className="notice">{message}</p> : null}</div>;
}
