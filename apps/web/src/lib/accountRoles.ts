export type AccountRole = "citizen" | "volunteer" | "ngo" | "admin" | "superadmin";
export type RoleApprovalStatus = "not_required" | "pending" | "approved" | "rejected";

export type AccountProfile = {
  id?: string;
  full_name: string | null;
  display_name: string | null;
  email: string | null;
  role: AccountRole;
  requested_role: AccountRole;
  role_approval_status: RoleApprovalStatus;
};

export const signupRoleOptions: Array<{ value: Exclude<AccountRole, "superadmin">; label: string; description: string }> = [
  {
    value: "citizen",
    label: "Citizen",
    description: "Report issues, support public records, vote, and comment.",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Request moderation access. Superadmin approval is required.",
  },
  {
    value: "volunteer",
    label: "Volunteer",
    description: "Help verify reports and coordinate local civic follow-up.",
  },
  {
    value: "ngo",
    label: "NGO",
    description: "Track public issues and coordinate organization-level action.",
  },
];

export function dashboardPathForProfile(profile: Pick<AccountProfile, "role" | "requested_role" | "role_approval_status"> | null | undefined) {
  if (!profile) return "/dashboard";

  if (profile.requested_role === "admin" && profile.role_approval_status === "pending") {
    return "/dashboard/admin-pending";
  }

  if (profile.role === "superadmin") return "/superadmin";
  if (profile.role === "admin") return "/admin";
  if (profile.role === "volunteer") return "/dashboard/volunteer";
  if (profile.role === "ngo") return "/dashboard/ngo";
  return "/dashboard/citizen";
}

export function roleLabel(role: string | null | undefined) {
  if (!role) return "Citizen";
  if (role === "ngo") return "NGO";
  return role.charAt(0).toUpperCase() + role.slice(1);
}
