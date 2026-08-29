"use client";

import Link from "next/link";
import { LogIn, LogOut, ShieldCheck, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

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
      <div className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm shadow-slate-200/60 lg:flex">
        {links.map((link) => (
          <Link
            className="rounded-full px-3 py-2 text-sm font-black text-slate-600 transition hover:bg-orange-100 hover:text-orange-800 xl:px-4"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="grid max-w-sm flex-1 grid-cols-3 gap-1 xl:hidden">
        {[links[0], links[1], session ? { href: "/admin" as const, label: "Account" } : { href: "/login" as const, label: "Sign in" }].map((link) => (
          <Link
            className="rounded-2xl px-2 py-2 text-center text-[10px] font-black uppercase tracking-[0.08em] text-slate-600 hover:bg-orange-100 hover:text-orange-800 sm:text-xs"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {isAdmin ? (
        <Link
          className="hidden shrink-0 items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-black text-orange-800 transition hover:bg-orange-100 md:inline-flex"
          href="/admin"
        >
          <ShieldCheck size={16} />
          Admin
        </Link>
      ) : null}

      {session ? (
        <div className="hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm shadow-slate-200/60 md:flex">
          <span className="inline-flex max-w-36 items-center gap-2 truncate text-sm font-black text-slate-700">
            <UserCircle size={16} className="shrink-0 text-orange-600" />
            <span className="truncate">{displayName}</span>
          </span>
          <button
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-orange-700"
            onClick={handleSignOut}
            title="Log out"
            type="button"
          >
            <LogOut size={15} />
          </button>
        </div>
      ) : (
        <Link
          className="hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm shadow-slate-200/60 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800 md:inline-flex"
          href="/login"
        >
          <LogIn size={16} />
          Sign in
        </Link>
      )}
    </nav>
  );
}
