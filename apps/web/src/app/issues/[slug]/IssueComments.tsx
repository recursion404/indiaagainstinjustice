"use client";

import Link from "next/link";
import { MessageCircle, Send, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Button, Notice, cn, inputClassName } from "@/components/ui";
import { supabase } from "@/lib/supabase";

type IssueComment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

const COMMENT_LIMITS = {
  min: 10,
  max: 1200
};

export function IssueComments({ issueId }: { issueId: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const [commentError, setCommentError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      const [{ data: sessionData }, { data: commentRows, error }] = await Promise.all([
        supabase.auth.getSession(),
        supabase
          .from("issue_comments")
          .select(`
            id,
            user_id,
            author_name,
            body,
            created_at,
            profiles:user_id (full_name, display_name, email)
          `)
          .eq("issue_id", issueId)
          .order("created_at", { ascending: true })
      ]);

      if (!active) return;

      setSession(sessionData.session);
      if (error) {
        setMessage({ tone: "error", text: "Comments could not be loaded right now." });
      } else {
        setComments((commentRows ?? []).map(mapComment));
      }
      setLoading(false);
    }

    void load();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [issueId]);

  async function postComment() {
    const trimmedComment = commentText.trim();

    if (!session) {
      setMessage({ tone: "error", text: "Please sign in before posting a comment." });
      return;
    }

    if (!trimmedComment) {
      setCommentError("Write a comment before posting.");
      setMessage({ tone: "error", text: "Your comment needs a little text before it can be posted." });
      return;
    }

    if (trimmedComment.length < COMMENT_LIMITS.min) {
      setCommentError(`Comment must be at least ${COMMENT_LIMITS.min} characters.`);
      setMessage({ tone: "error", text: "Please add a little more context so the comment is useful to others." });
      return;
    }

    if (trimmedComment.length > COMMENT_LIMITS.max) {
      setCommentError(`Comment must be ${COMMENT_LIMITS.max} characters or fewer.`);
      setMessage({ tone: "error", text: "Please shorten the comment before posting." });
      return;
    }

    setPosting(true);
    setCommentError("");
    setMessage({ tone: "info", text: "Posting your comment..." });
    try {
      const authorName =
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        session.user.email ||
        "Citizen";

      const { data, error } = await supabase
        .from("issue_comments")
        .insert({
          issue_id: issueId,
          user_id: session.user.id,
          author_name: authorName,
          body: trimmedComment
        })
        .select(`
          id,
          user_id,
          author_name,
          body,
          created_at,
          profiles:user_id (full_name, display_name, email)
        `)
        .single();

      if (error) throw error;

      setComments((current) => [...current, mapComment(data)]);
      setCommentText("");
      setMessage({ tone: "success", text: "Comment posted." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not post comment." });
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-900/5">
      <div className="mb-6 flex flex-col justify-between gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-orange-700">
            <MessageCircle size={14} />
            Public discussion
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">Community comments</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Everyone can read the discussion. Sign in to add your view.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-slate-500">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </span>
      </div>

      {loading ? (
        <p className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">Loading comments...</p>
      ) : comments.length ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <article className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4" key={comment.id}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <UserCircle className="shrink-0 text-orange-600" size={18} />
                  <strong className="truncate text-sm font-black text-slate-900">{comment.authorName}</strong>
                </div>
                <time className="shrink-0 text-xs font-bold text-slate-400">
                  {new Date(comment.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </time>
              </div>
              <p className="whitespace-pre-line text-sm font-medium leading-6 text-slate-700">{comment.body}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm font-black text-slate-900">No comments yet</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">Start the public discussion after signing in.</p>
        </div>
      )}

      <div className="mt-6 border-t border-slate-100 pt-6">
        {session ? (
          <div className="space-y-3">
            <textarea
              aria-invalid={Boolean(commentError)}
              className={cn(inputClassName, "min-h-32 resize-y", commentError && "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20")}
              maxLength={COMMENT_LIMITS.max}
              onChange={(event) => {
                setCommentText(event.target.value);
                if (commentError) setCommentError("");
              }}
              placeholder="Add a public comment, local observation, or useful context..."
              value={commentText}
            />
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-col gap-1">
                {commentError ? <span className="text-xs font-bold text-rose-600">{commentError}</span> : null}
                <span className="text-xs font-bold text-slate-400">{commentText.trim().length}/{COMMENT_LIMITS.max} characters</span>
              </div>
              <Button disabled={posting} onClick={postComment}>
                <Send size={16} />
                {posting ? "Posting..." : "Post comment"}
              </Button>
            </div>
          </div>
        ) : (
          <Notice tone="muted" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>Sign in to comment on this issue. You can still browse the public record without an account.</span>
            <Link className="inline-flex justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-orange-700" href="/login">
              Sign in
            </Link>
          </Notice>
        )}

        {message ? (
          <p
            className={cn(
              "mt-3 rounded-xl border px-4 py-3 text-sm font-extrabold",
              message.tone === "success" && "border-emerald-100 bg-emerald-50 text-emerald-800",
              message.tone === "error" && "border-rose-100 bg-rose-50 text-rose-800",
              message.tone === "info" && "border-orange-100 bg-orange-50 text-orange-800"
            )}
          >
            {message.text}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function mapComment(row: any): IssueComment {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    authorName: profile?.display_name || profile?.full_name || row.author_name || profile?.email || "Citizen",
    body: row.body,
    createdAt: row.created_at
  };
}
