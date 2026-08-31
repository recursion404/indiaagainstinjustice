"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { dashboardPathForProfile, type AccountRole, type RoleApprovalStatus } from "@/lib/accountRoles";
import { supabase } from "@/lib/supabase";
import { PageShell } from "@/components/ui";

export default function DashboardRouterPage() {
  const router = useRouter();

  useEffect(() => {
    async function routeUser() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, requested_role, role_approval_status")
        .eq("id", sessionData.session.user.id)
        .maybeSingle();

      router.replace(dashboardPathForProfile(profile ? {
        role: profile.role as AccountRole,
        requested_role: (profile.requested_role ?? profile.role) as AccountRole,
        role_approval_status: (profile.role_approval_status ?? "not_required") as RoleApprovalStatus
      } : null));
    }

    void routeUser();
  }, [router]);

  return (
    <PageShell>
      <p className="text-sm font-medium text-muted-foreground">Opening your dashboard...</p>
    </PageShell>
  );
}
