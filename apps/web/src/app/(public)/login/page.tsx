"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle, CheckCircle, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Clear states on view toggle
  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [isSignUp]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password.trim()) {
      return setError("Please enter your email and password.");
    }

    if (isSignUp && !fullName.trim()) {
      return setError("Please enter your full name.");
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Run Supabase Auth SignUp
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          setSuccess("Account created and signed in successfully!");
          router.push("/");
          router.refresh();
        } else {
          setSuccess("Account created successfully! Please check your email to verify your address.");
        }
      } else {
        // Run Supabase Auth SignIn
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.session) {
          setSuccess("Signed in successfully!");
          
          // Verify role to determine redirection
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.session.user.id)
            .single();

          if (profile && (profile.role === "admin" || profile.role === "superadmin")) {
            router.push("/admin");
          } else {
            router.push("/");
          }
          router.refresh();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container max-w-md mx-auto py-16 px-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-900/5 p-8 space-y-6">
        {/* Card Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-700 border border-orange-100 uppercase tracking-widest mb-3">
            {isSignUp ? "Citizen Join" : "Secure Gate"}
          </span>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight leading-snug">
            {isSignUp ? "Create a Citizen Account" : "Sign In to Your Account"}
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            {isSignUp 
              ? "Join India's premier public accountability and civic reporting framework." 
              : "Access your dashboard, manage reports, and participate in local polls."}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex gap-2 p-4 rounded-xl border border-rose-100 bg-rose-50 text-rose-800 text-xs font-bold leading-relaxed items-start">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex gap-2 p-4 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-800 text-xs font-bold leading-relaxed items-start">
            <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <User size={12} className="text-slate-400" /> Full Name
              </label>
              <input
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all"
                type="text"
                placeholder="e.g. Ganesh Pawar"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                disabled={loading}
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Mail size={12} className="text-slate-400" /> Email Address
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all"
              type="email"
              placeholder="e.g. name@domain.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Lock size={12} className="text-slate-400" /> Password
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold text-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
              required
            />
          </div>



          <button
            type="submit"
            className="w-full px-5 py-3 text-sm font-black text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 rounded-xl shadow-md transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              "Processing..."
            ) : isSignUp ? (
              <>
                <UserPlus size={16} /> Create Citizen Account
              </>
            ) : (
              <>
                <LogIn size={16} /> Sign In
              </>
            )}
          </button>
        </form>

        {/* View Toggle */}
        <div className="border-t border-slate-100 pt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline transition-all"
            disabled={loading}
          >
            {isSignUp 
              ? "Already have a Citizen account? Sign In" 
              : "New to the platform? Join as Citizen"}
          </button>
        </div>
      </div>
    </main>
  );
}
