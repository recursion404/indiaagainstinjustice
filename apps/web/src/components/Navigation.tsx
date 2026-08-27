"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogIn, LogOut, User, Shield, CheckSquare, BarChart3, Radio, FileSpreadsheet, Send } from "lucide-react";

export default function Navigation() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) void fetchRole(data.session.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) void fetchRole(nextSession.user.id);
      else setRole(null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function fetchRole(userId: string) {
    const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
    if (data) setRole(data.role);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const links = [
    { href: "/live-traffic", label: "Civic Issues", icon: Radio },
    { href: "/report-traffic-problem", label: "Report Issue", icon: Send },
    { href: "/top-traffic-problems", label: "Public Records", icon: FileSpreadsheet },
    { href: "/polls", label: "Polls", icon: BarChart3 },
    { href: "/traffic-rules-pledge", label: "Pledge", icon: CheckSquare },
  ];

  return (
    <>
      {/* Desktop Header Links */}
      <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href as any}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                isActive 
                  ? "bg-orange-50 text-orange-700 font-extrabold" 
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
              }`}
            >
              {link.label}
            </Link>
          );
        })}

        <Link
          href="/volunteer"
          className="ml-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 rounded-full shadow-sm hover:shadow transition-all"
        >
          Join Volunteer
        </Link>

        <span className="w-px h-6 bg-slate-100 mx-3" />

        {session ? (
          <div className="flex items-center gap-2">
            {(role === "admin" || role === "superadmin") && (
              <Link
                href="/admin"
                className="p-2 text-slate-500 hover:text-orange-600 hover:bg-slate-50 rounded-lg transition-all"
                title="Admin Panel"
              >
                <Shield size={18} />
              </Link>
            )}
            <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <User size={12} className="text-orange-600" /> {session.user.user_metadata?.full_name || session.user.email?.split("@")[0]}
            </span>
            <button
              onClick={signOut}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-extrabold text-slate-700 hover:text-slate-950 hover:bg-slate-50 rounded-lg transition-all flex items-center gap-1.5"
          >
            <LogIn size={16} className="text-orange-600" /> Sign In
          </Link>
        )}
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around h-16 border-t border-slate-100 bg-white/95 backdrop-blur-md px-2 pb-safe shadow-lg" aria-label="Mobile bottom navigation">
        <Link href="/" className={`flex flex-col items-center justify-center gap-0.5 flex-1 ${pathname === "/" ? "text-orange-600" : "text-slate-500"}`}>
          <span className="text-lg">🏛️</span>
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link href="/live-traffic" className={`flex flex-col items-center justify-center gap-0.5 flex-1 ${pathname === "/live-traffic" ? "text-orange-600" : "text-slate-500"}`}>
          <span className="text-lg">📢</span>
          <span className="text-[10px] font-bold">Issues</span>
        </Link>
        <Link href="/report-traffic-problem" className="flex flex-col items-center justify-center gap-0.5 text-orange-600 hover:text-orange-700 flex-1 relative -top-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-200">
            <span className="text-xl">＋</span>
          </div>
        </Link>
        <Link href="/polls" className={`flex flex-col items-center justify-center gap-0.5 flex-1 ${pathname === "/polls" ? "text-orange-600" : "text-slate-500"}`}>
          <span className="text-lg">📊</span>
          <span className="text-[10px] font-bold">Polls</span>
        </Link>
        {session ? (
          <button 
            onClick={signOut}
            className="flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-rose-600 flex-1"
          >
            <span className="text-lg">🚪</span>
            <span className="text-[10px] font-bold">Log Out</span>
          </button>
        ) : (
          <Link href="/login" className={`flex flex-col items-center justify-center gap-0.5 flex-1 ${pathname === "/login" ? "text-orange-600" : "text-slate-500"}`}>
            <span className="text-lg">🔑</span>
            <span className="text-[10px] font-bold">Sign In</span>
          </Link>
        )}
      </nav>
    </>
  );
}
