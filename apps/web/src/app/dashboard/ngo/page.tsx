"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboard } from "@/components/dashboards/RoleDashboard";
import { dashboardPathForProfile, type AccountRole, type RoleApprovalStatus } from "@/lib/accountRoles";
import { supabase } from "@/lib/supabase";

export default function NgoDashboardPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("display_name, full_name, email, role, requested_role, role_approval_status")
        .eq("id", sessionData.session.user.id)
        .maybeSingle();
      const path = dashboardPathForProfile(data ? {
        role: data.role as AccountRole,
        requested_role: (data.requested_role ?? data.role) as AccountRole,
        role_approval_status: (data.role_approval_status ?? "not_required") as RoleApprovalStatus
      } : null);
      if (path !== "/dashboard/ngo") {
        router.replace(path);
        return;
      }
      setName(data?.display_name || data?.full_name || data?.email || sessionData.session.user.email || null);
    }

    void loadProfile();
  }, [router]);

  return <RoleDashboard role="ngo" name={name} />;
}
