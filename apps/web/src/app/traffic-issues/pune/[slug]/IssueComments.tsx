"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Comment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export function IssueComments({ issueId, initialCount }: { issueId: string; initialCount: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [message, setMessage] = useState("");
  const [count, setCount] = useState(initialCount);
  const [session, setSession] = useState<{ user: { id: string; user_metadata?: { full_name?: string } } } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSession(data.session);
    });
  }, []);

  async function loadComments() {
    const { data, error } = await supabase
      .from("issue_comments")
      .select(`
        id,
        user_id,
        author_name,
        body,
        created_at,
        profiles:user_id (full_name)
      `)
      .eq("issue_id", issueId)
      .order("created_at", { ascending: true });

    if (error) {
      setMessage("Could not load comments.");
      return;
    }

    setComments(
      (data ?? []).map((row: any) => ({
        id: row.id,
        authorName: (row.profiles as any)?.full_name || row.author_name || "Anonymous Citizen",
        body: row.body,
        createdAt: row.created_at
      }))
    );
    setLoaded(true);
  }

  async function handleToggle() {
    if (!showComments && !loaded) {
      await loadComments();
    }
    setShowComments((prev) => !prev);
  }

  async function handlePost() {
    if (!commentText.trim()) return;
    setIsPosting(true);
    try {
      const userId = session?.user?.id ?? null;
      const authorName = session?.user?.user_metadata?.full_name ?? null;
      const { data, error } = await supabase
        .from("issue_comments")
        .insert({
          issue_id: issueId,
          user_id: userId,
          author_name: authorName,
          body: commentText.trim()
        })
        .select(`
          id,
          user_id,
          author_name,
          body,
          created_at,
          profiles:user_id (full_name)
        `)
        .single();

      if (error) throw error;

      const row = data as any;
      const newComment: Comment = {
        id: row.id,
        authorName: (row.profiles as any)?.full_name || row.author_name || "Anonymous Citizen",
        body: row.body,
        createdAt: row.created_at
      };
      setComments((prev) => [...prev, newComment]);
      setCount((c) => c + 1);
      setCommentText("");
    } catch {
      setMessage("Could not post comment. Please try again.");
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <section className="band">
      <button
        className="button secondary"
        type="button"
        onClick={handleToggle}
        style={{ marginBottom: "1rem" }}
      >
        {showComments ? "Hide comments" : `Comments (${count})`}
      </button>

      {showComments ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {!loaded ? (
            <p className="muted">Loading comments…</p>
          ) : comments.length === 0 ? (
            <p className="muted">No comments yet. Be the first to comment!</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {comments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    borderLeft: "3px solid var(--line)",
                    paddingLeft: "0.75rem"
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "0.8rem" }}>
                    {c.authorName}{" "}
                    <span style={{ fontWeight: 400, color: "var(--muted)" }}>
                      · {new Date(c.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </p>
                  <p style={{ margin: "0.25rem 0 0" }}>{c.body}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
            <textarea
              className="field"
              rows={3}
              placeholder="Add a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{ flex: 1, margin: 0 }}
            />
            <button
              className="button"
              type="button"
              disabled={isPosting || !commentText.trim()}
              onClick={handlePost}
            >
              {isPosting ? "Posting…" : "Post"}
            </button>
          </div>
          {message ? <p className="notice">{message}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
