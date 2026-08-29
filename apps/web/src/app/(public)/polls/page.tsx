"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createPoll, getPublicPolls } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { BarChart3, Plus, X, Award, HelpCircle } from "lucide-react";

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
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-100">
        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-700 border border-orange-100 uppercase tracking-widest mb-3">
            Civic Consensus
          </span>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <BarChart3 className="text-orange-600" /> Public Priority Polls
          </h1>
          <p className="text-slate-500 font-semibold mt-1">
            Cast your vote on active polls to help rank civic problems and prioritize neighborhood solutions.
          </p>
        </div>
        
        {session && (
          <button
            className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-black rounded-xl shadow-lg transition-all ${
              showCreate 
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-none" 
                : "bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white shadow-orange-100"
            }`}
            type="button"
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? <><X size={16} /> Close Form</> : <><Plus size={16} /> Create Priority Poll</>}
          </button>
        )}
      </div>

      {showCreate && session && (
        <section className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-900/5 p-8 mb-10 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Create a New Priority Poll</h2>
            <p className="text-slate-500 text-sm font-semibold mt-1">Draft a prompt to gather citizen votes on localized traffic bottlenecks or infrastructure actions.</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-extrabold text-slate-700">Question / Prompt *</label>
              <input
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="e.g. Which junction requires an immediate pedestrian subway?"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.map((opt, idx) => (
                <div className="flex flex-col gap-2" key={idx}>
                  <label className="text-sm font-extrabold text-slate-700">
                    Option {idx + 1}{idx < 2 ? " *" : " (optional)"}
                  </label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all"
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[idx] = e.target.value;
                      setOptions(next);
                    }}
                    placeholder={`Option ${idx + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button 
              className="px-8 py-3 text-sm font-black text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 rounded-xl shadow-md transition-all" 
              type="button" 
              disabled={isSubmitting} 
              onClick={handleCreatePoll}
            >
              {isSubmitting ? "Creating..." : "Publish Priority Poll"}
            </button>
          </div>
        </section>
      )}

      {message && (
        <div className={`p-4 rounded-xl border text-sm font-extrabold mb-8 ${
          message.toLowerCase().includes("not") || message.toLowerCase().includes("unable") || message.toLowerCase().includes("sign in")
            ? "bg-rose-50 border-rose-100 text-rose-800" 
            : "bg-orange-50 border-orange-100 text-orange-800"
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {polls.map((poll) => {
          const pollOptions = (poll.poll_options ?? []) as Array<{ id: string; label: string; vote_count: number }>;
          const total = pollOptions.reduce((sum, option) => sum + option.vote_count, 0);
          return (
            <article className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-900/5 p-6 flex flex-col gap-6" key={poll.id}>
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-50 text-orange-700 border border-orange-100 uppercase tracking-wider mb-3">
                  <HelpCircle size={10} /> Community Question
                </span>
                <h2 className="text-xl font-extrabold text-slate-950 tracking-tight leading-snug">
                  {poll.question}
                </h2>
              </div>

              <div className="space-y-3">
                {pollOptions.map((option) => {
                  const percent = total ? Math.round((option.vote_count / total) * 100) : 0;
                  return (
                    <button 
                      className="group flex flex-col gap-2 w-full p-4 border border-slate-100 hover:border-orange-200 bg-slate-50/50 hover:bg-orange-50/10 rounded-2xl text-left transition-all cursor-pointer relative overflow-hidden" 
                      type="button" 
                      key={option.id} 
                      onClick={() => vote(poll.id, option.id)}
                    >
                      <div className="flex justify-between items-center gap-4 relative z-10">
                        <strong className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                          {option.label}
                        </strong>
                        <small className="text-xs font-bold text-slate-500 whitespace-nowrap bg-white px-2 py-0.5 rounded-md border border-slate-100 shadow-sm shadow-slate-950/2">
                          {option.vote_count} votes · {percent}%
                        </small>
                      </div>
                      
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1 relative z-10">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }} 
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-auto border-t border-slate-50 pt-4 flex items-center gap-1.5">
                <Award size={14} className="text-slate-300" /> {total} total votes registered
              </p>
            </article>
          );
        })}
      </div>
    </main>
  );
}
