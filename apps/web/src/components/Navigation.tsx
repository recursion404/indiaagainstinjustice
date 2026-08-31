"use client";

import Link from "next/link";
import { LogIn, LogOut, ShieldCheck, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { DownloadAppButton } from "@/components/pwa/DownloadAppButton";

const links = [
  { href: "/issues", label: "Issues" },
  { href: "/report", label: "Report" },
  { href: "/records", label: "Records" },
  { href: "/polls", label: "Polls" },
  { href: "/pledge", label: "Pledge" },
  { href: "/volunteer", label: "Volunteer" },
] as const;

type ProfileSummary = {
  full_name: string | null;
  display_name: string | null;
  email: string | null;
  role: string | null;
};

export default function Navigation() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile(nextSession: Session | null) {
      setSession(nextSession);

      if (!nextSession) {
        setProfile(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, display_name, email, role")
        .eq("id", nextSession.user.id)
        .maybeSingle();

      if (!active) return;

      setProfile({
        full_name: data?.full_name ?? null,
        display_name: data?.display_name ?? null,
        email: data?.email ?? nextSession.user.email ?? null,
        role: data?.role ?? null,
      });
    }

    supabase.auth.getSession().then(({ data }) => {
      if (active) void loadProfile(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      window.setTimeout(() => {
        if (active) void loadProfile(nextSession);
      }, 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  const isAdmin = profile?.role === "admin" || profile?.role === "superadmin";
  const displayName = profile?.display_name || profile?.full_name || profile?.email || session?.user.email || "Citizen";

  return (
    <nav className="flex min-w-0 flex-1 items-center justify-end gap-2">
      <div className="hidden items-center gap-1 lg:flex">
        {links.map((link) => (
          <Link
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground xl:px-4"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="grid max-w-md flex-1 grid-cols-4 gap-1 xl:hidden">
        {[links[0], links[1], session ? { href: "/admin" as const, label: "Account" } : { href: "/login" as const, label: "Sign in" }].map((link) => (
          <Link
            className="rounded-md px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground hover:bg-muted hover:text-foreground sm:text-xs"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
        <DownloadAppButton compact />
      </div>

      <DownloadAppButton className="hidden md:block" />

      {isAdmin ? (
        <Link
          className="hidden h-10 shrink-0 items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/15 md:inline-flex"
          href="/admin"
        >
          <ShieldCheck size={16} />
          Admin
        </Link>
      ) : null}

      {session ? (
        <div className="hidden h-10 shrink-0 items-center gap-2 rounded-md border border-border bg-background px-3 shadow-sm md:flex">
          <span className="inline-flex max-w-36 items-center gap-2 truncate text-sm font-medium text-foreground">
            <UserCircle size={16} className="shrink-0 text-primary" />
            <span className="truncate">{displayName}</span>
          </span>
          <button
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={handleSignOut}
            title="Log out"
            type="button"
          >
            <LogOut size={15} />
          </button>
        </div>
      ) : (
        <Link
          className="hidden h-10 shrink-0 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted md:inline-flex"
          href="/login"
        >
          <LogIn size={16} />
          Sign in
        </Link>
      )}
    </nav>
  );
}
