"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createPoll, getPublicPolls } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { BarChart3, Plus, X, Award, HelpCircle } from "lucide-react";
import { Badge, Button, Card, Field, Notice, PageShell, SectionHeader, inputClassName } from "@/components/ui";

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
    <PageShell className="max-w-5xl">
      <SectionHeader
        eyebrow={<Badge><BarChart3 size={12} /> Civic consensus</Badge>}
        title="Public priority polls"
        description="Cast your vote on active polls to help rank civic problems and prioritize neighborhood solutions."
        action={session ? (
          <Button variant={showCreate ? "secondary" : "primary"} onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? <><X size={16} /> Close Form</> : <><Plus size={16} /> Create Priority Poll</>}
          </Button>
        ) : null}
      />

      {showCreate && session && (
        <Card className="mb-8 space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-xl font-semibold text-foreground">Create a New Priority Poll</h2>
            <p className="text-muted-foreground text-sm font-semibold mt-1">Draft a prompt to gather citizen votes on localized traffic bottlenecks or infrastructure actions.</p>
          </div>

          <div className="space-y-4">
            <Field label="Question / Prompt *">
              <input
                className={inputClassName}
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="e.g. Which junction requires an immediate pedestrian subway?"
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.map((opt, idx) => (
                <Field key={idx} label={`Option ${idx + 1}${idx < 2 ? " *" : " (optional)"}`}>
                  <input
                    className={inputClassName}
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[idx] = e.target.value;
                      setOptions(next);
                    }}
                    placeholder={`Option ${idx + 1}`}
                  />
                </Field>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button disabled={isSubmitting} onClick={handleCreatePoll}>
              {isSubmitting ? "Creating..." : "Publish Priority Poll"}
            </Button>
          </div>
        </Card>
      )}

      {message && (
        <Notice
          className="mb-8"
          tone={message.toLowerCase().includes("not") || message.toLowerCase().includes("unable") || message.toLowerCase().includes("sign in") ? "urgent" : "default"}
        >
          {message}
        </Notice>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {polls.map((poll) => {
          const pollOptions = (poll.poll_options ?? []) as Array<{ id: string; label: string; vote_count: number }>;
          const total = pollOptions.reduce((sum, option) => sum + option.vote_count, 0);
          return (
            <Card className="flex flex-col gap-6" key={poll.id}>
              <div>
                <Badge className="mb-3"><HelpCircle size={12} /> Community question</Badge>
                <h2 className="text-xl font-semibold text-foreground tracking-tight leading-snug">
                  {poll.question}
                </h2>
              </div>

              <div className="space-y-3">
                {pollOptions.map((option) => {
                  const percent = total ? Math.round((option.vote_count / total) * 100) : 0;
                  return (
                    <button
                      className="group flex flex-col gap-2 w-full p-4 border border-border hover:border-primary/30 bg-muted/50 hover:bg-primary/10 rounded-md text-left transition-all cursor-pointer relative overflow-hidden"
                      type="button"
                      key={option.id}
                      onClick={() => vote(poll.id, option.id)}
                    >
                      <div className="flex justify-between items-center gap-4 relative z-10">
                        <strong className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {option.label}
                        </strong>
                        <small className="text-xs font-medium text-muted-foreground whitespace-nowrap bg-card px-2 py-0.5 rounded-md border border-border shadow-sm">
                          {option.vote_count} votes · {percent}%
                        </small>
                      </div>

                      <div className="w-full h-1.5 bg-muted rounded-md overflow-hidden mt-1 relative z-10">
                        <div
                          className="h-full bg-primary rounded-md transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-auto border-t border-border pt-4 flex items-center gap-1.5">
                <Award size={14} className="text-muted-foreground" /> {total} total votes registered
              </p>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
