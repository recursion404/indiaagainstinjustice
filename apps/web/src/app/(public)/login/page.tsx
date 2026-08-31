"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";
import { Badge, Button, Card, Field, PageShell, inputClassName } from "@/components/ui";
import { dashboardPathForProfile, roleLabel, signupRoleOptions, type AccountRole, type RoleApprovalStatus } from "@/lib/accountRoles";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [requestedRole, setRequestedRole] = useState<Exclude<AccountRole, "superadmin">>("citizen");
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
              requested_role: requestedRole,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          setSuccess("Account created and signed in successfully!");
          router.push(requestedRole === "admin" ? "/dashboard/admin-pending" : dashboardPathForProfile({
            role: requestedRole,
            requested_role: requestedRole,
            role_approval_status: "not_required"
          }));
          router.refresh();
        } else {
          setSuccess(requestedRole === "admin"
            ? "Account created. After email verification, your admin access request will wait for superadmin approval."
            : "Account created successfully! Please check your email to verify your address.");
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
            .select("role, requested_role, role_approval_status")
            .eq("id", data.session.user.id)
            .single();

          router.push(dashboardPathForProfile(profile ? {
            role: profile.role as AccountRole,
            requested_role: (profile.requested_role ?? profile.role) as AccountRole,
            role_approval_status: (profile.role_approval_status ?? "not_required") as RoleApprovalStatus
          } : null));
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
    <PageShell className="max-w-md py-16">
      <Card className="space-y-6">
        <div className="text-center">
          <Badge className="mx-auto mb-3">{isSignUp ? "Create account" : "Secure gate"}</Badge>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight leading-snug">
            {isSignUp ? "Create Your Account" : "Sign In to Your Account"}
          </h1>
          <p className="text-xs font-semibold text-muted-foreground mt-1">
            {isSignUp 
              ? "Join India's premier public accountability and civic reporting framework." 
              : "Access your dashboard, manage reports, and participate in local polls."}
          </p>
        </div>

        {error && (
          <div className="flex gap-2 p-4 rounded-md border border-destructive/20 bg-destructive/10 text-destructive text-xs font-bold leading-relaxed items-start">
            <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex gap-2 p-4 rounded-md border border-secondary/20 bg-secondary/10 text-secondary text-xs font-bold leading-relaxed items-start">
            <CheckCircle size={16} className="text-secondary shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <Field label={<span className="flex items-center gap-1"><User size={12} className="text-muted-foreground" /> Full Name</span>}>
              <input
                className={inputClassName}
                type="text"
                placeholder="e.g. Ganesh Pawar"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                disabled={loading}
                required
              />
            </Field>
          )}

          {isSignUp ? (
            <Field label="Account type">
              <div className="grid gap-2">
                {signupRoleOptions.map((option) => (
                  <button
                    className={`rounded-md border px-3 py-3 text-left transition-colors ${
                      requestedRole === option.value
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                    key={option.value}
                    onClick={() => setRequestedRole(option.value)}
                    type="button"
                  >
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.description}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {requestedRole === "admin"
                  ? "Admin accounts can sign in immediately, but moderation tools unlock only after superadmin approval."
                  : `${roleLabel(requestedRole)} accounts can start using their dashboard after signup.`}
              </p>
            </Field>
          ) : null}

          <Field label={<span className="flex items-center gap-1"><Mail size={12} className="text-muted-foreground" /> Email Address</span>}>
            <input
              className={inputClassName}
              type="email"
              placeholder="e.g. name@domain.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              required
            />
          </Field>

          <Field label={<span className="flex items-center gap-1"><Lock size={12} className="text-muted-foreground" /> Password</span>}>
            <input
              className={inputClassName}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
              required
            />
          </Field>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              "Processing..."
            ) : isSignUp ? (
              <>
                <UserPlus size={16} /> Create Account
              </>
            ) : (
              <>
                <LogIn size={16} /> Sign In
              </>
            )}
          </Button>
        </form>

        <div className="border-t border-border pt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-medium text-primary hover:underline"
            disabled={loading}
            type="button"
          >
            {isSignUp 
              ? "Already have an account? Sign In"
              : "New to the platform? Create an account"}
          </button>
        </div>
      </Card>
    </PageShell>
  );
}
