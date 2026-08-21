"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createPoll, getPublicPolls } from "@/lib/data";
import { supabase } from "@/lib/supabase";

type Poll = Awaited<ReturnType<typeof getPublicPolls>>[number];

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState("Loading public polls...");

  // Create poll form state
  const [showCreate, setShowCreate] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function load() {
    try {
      const nextPolls = await getPublicPolls();
      setPolls(nextPolls);
      setMessage(nextPolls.length ? "Vote once on each public poll. You can change your choice later." : "No public polls are available yet.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load polls.");
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    void load();
    return () => listener.subscription.unsubscribe();
  }, []);

  async function vote(pollId: string, optionId: string) {
    if (!session) return setMessage("Sign in before voting. You can create an account on the report page.");
    const { error } = await supabase.from("poll_votes").upsert({ poll_id: pollId, option_id: optionId, user_id: session.user.id }, { onConflict: "poll_id,user_id" });
    if (error) setMessage(error.message);
    else { setMessage("Vote recorded. Results updated."); await load(); }
  }

  async function handleCreatePoll() {
    if (!session) return;
    const filled = options.filter((o) => o.trim());
    if (!newQuestion.trim() || filled.length < 2) {
      setMessage("Please enter a question and at least 2 options.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createPoll(newQuestion, filled, session.user.id);
      setMessage("Poll submitted! It will appear here once an admin makes it public.");
      setNewQuestion("");
      setOptions(["", "", "", ""]);
      setShowCreate(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create poll.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="container band">
      <div className="sectionHeader">
        <h1>Pune Traffic Polls</h1>
        <span className="status">Citizen priorities</span>
        {session ? (
          <button
            className={`button${showCreate ? " secondary" : ""}`}
            type="button"
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? "Cancel" : "Create Poll"}
          </button>
        ) : null}
      </div>

      {showCreate && session ? (
        <section className="card form">
          <h2>Create a New Poll</h2>
          <label className="field">
            Question *
            <input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="e.g. Which area needs an immediate flyover?"
            />
          </label>
          {options.map((opt, idx) => (
            <label className="field" key={idx}>
              Option {idx + 1}{idx < 2 ? " *" : " (optional)"}
              <input
                value={opt}
                onChange={(e) => {
                  const next = [...options];
                  next[idx] = e.target.value;
                  setOptions(next);
                }}
                placeholder={`Option ${idx + 1}`}
              />
            </label>
          ))}
          <div className="actions">
            <button className="button" type="button" disabled={isSubmitting} onClick={handleCreatePoll}>
              {isSubmitting ? "Creating..." : "Publish Poll"}
            </button>
          </div>
        </section>
      ) : null}

      <p className="notice">{message}</p>
      <div className="grid">
        {polls.map((poll) => {
          const pollOptions = (poll.poll_options ?? []) as Array<{ id: string; label: string; vote_count: number }>;
          const total = pollOptions.reduce((sum, option) => sum + option.vote_count, 0);
          return (
            <article className="card" key={poll.id}>
              <h2>{poll.question}</h2>
              {pollOptions.map((option) => {
                const percent = total ? Math.round((option.vote_count / total) * 100) : 0;
                return (
                  <button className="pollOption" type="button" key={option.id} onClick={() => vote(poll.id, option.id)}>
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.vote_count} votes · {percent}%</small>
                    </span>
                    <span className="pollBar"><i style={{ width: `${percent}%` }} /></span>
                  </button>
                );
              })}
              <p className="muted">{total} total votes</p>
            </article>
          );
        })}
      </div>
    </main>
  );
}
