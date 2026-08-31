"use client";

import Link from "next/link";
import { Clock3, LogOut, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, ButtonLink, Card, PageShell } from "@/components/ui";
import { dashboardPathForProfile, type AccountRole, type RoleApprovalStatus } from "@/lib/accountRoles";
import { supabase } from "@/lib/supabase";

export default function AdminPendingPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      setEmail(sessionData.session.user.email ?? null);
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, requested_role, role_approval_status")
        .eq("id", sessionData.session.user.id)
        .maybeSingle();

      const path = dashboardPathForProfile(profile ? {
        role: profile.role as AccountRole,
        requested_role: (profile.requested_role ?? profile.role) as AccountRole,
        role_approval_status: (profile.role_approval_status ?? "not_required") as RoleApprovalStatus
      } : null);

      if (path !== "/dashboard/admin-pending") router.replace(path);
    }

    void loadProfile();
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  return (
    <PageShell className="max-w-3xl py-16">
      <Card className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Clock3 size={22} />
        </span>
        <Badge className="mx-auto mt-5">Admin request pending</Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Your admin account is waiting for approval</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
          You can sign in with {email ?? "this account"}, but moderation tools unlock only after a superadmin approves the request.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/issues" variant="secondary">
            <ShieldCheck size={16} /> Browse public issues
          </ButtonLink>
          <Button onClick={signOut} variant="ghost">
            <LogOut size={16} /> Sign out
          </Button>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          Need to browse public records? <Link className="font-medium text-primary hover:underline" href="/issues">Open public issues</Link>.
        </p>
      </Card>
    </PageShell>
  );
}
