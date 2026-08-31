import { issueCategoryLabels, type IssueCategory, type IssueStatus, type PublicIssue } from "@citizens-first/shared";
import type { AccountRole, RoleApprovalStatus } from "./accountRoles";
import { supabase } from "./supabase";

export type WebsiteIssue = PublicIssue & {
  trafficCondition: PublicIssue["trafficCondition"];
  severity: PublicIssue["severity"];
  locationName: string | null;
  locationKind: PublicIssue["locationKind"];
  suggestedSolution: string | null;
  customCategory: string | null;
  isPublic: boolean;
  isSensitive: boolean;
  indexable: boolean;
  privateAddress: string | null;
  citizenLandmark: string | null;
  pincode: string | null;
  wardNumber: string | null;
  authorityName: string | null;
  authorityReference: string | null;
  internalNotes: string | null;
  rejectionReason: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
};

const issueFields =
  "id, public_id, reporter_id, summary, category, subcategory, status, state, district, town_village, description, additional_location_detail, pincode, rejection_reason, created_at, updated_at";

const publicIssueStatuses = [
  "verified",
  "published",
  "action_started",
  "action_taken",
  "closed"
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function issueSlug(row: Record<string, any>) {
  const title = row.summary || row.category || "public-issue";
  const location = row.town_village || row.district || row.state || "india";
  const publicId = String(row.public_id || "").toLowerCase();
  return `${slugify(`${title} ${location}`)}-${publicId}`;
}

function mapIssue(row: Record<string, any>): WebsiteIssue {
  const publicId = row.public_id;
  return {
    id: row.id,
    publicId: publicId,
    title: row.summary || categoryLabel(row.category),
    slug: issueSlug(row),
    category: row.category,
    customCategory: row.subcategory ?? null,
    status: row.status,
    severity: "moderate",
    trafficCondition: "heavy",
    state: row.state,
    district: row.district ?? null,
    townVillage: row.town_village,
    summary: row.description,
    locationName: row.additional_location_detail,
    locationKind: "area",
    suggestedSolution: null,
    supportCount: 0,
    shareCount: 0,
    confirmationCount: 0,
    notObservedCount: 0,
    commentCount: 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
    isPublic: publicIssueStatuses.includes(row.status),
    isSensitive: false,
    indexable: true,
    privateAddress: null,
    citizenLandmark: null,
    pincode: row.pincode,
    wardNumber: null,
    authorityName: null,
    authorityReference: null,
    internalNotes: null,
    rejectionReason: row.rejection_reason,
    publishedAt: row.created_at
  };
}

export async function getPublicIssues(limit = 50) {
  const { data, error } = await supabase
    .from("reports")
    .select(issueFields)
    .in("status", publicIssueStatuses)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapIssue);
}

export async function getPublicIssueBySlug(slug: string) {
  const publicIdMatch = slug.match(/(iai-[a-z0-9]+)$/i);
  const legacyUuidPrefix = slug.startsWith("report-") ? slug.replace("report-", "") : null;

  if (publicIdMatch) {
    const { data, error } = await supabase
      .from("reports")
      .select(issueFields)
      .in("status", publicIssueStatuses)
      .ilike("public_id", publicIdMatch[1])
      .maybeSingle();

    if (error) throw error;
    return data ? mapIssue(data) : null;
  }

  if (legacyUuidPrefix) {
    const { data, error } = await supabase
      .from("reports")
      .select(issueFields)
      .in("status", publicIssueStatuses)
      .limit(1000);

    if (error) throw error;
    const row = (data ?? []).find((issue) => String(issue.id).startsWith(legacyUuidPrefix));
    return row ? mapIssue(row) : null;
  }

  return null;
}

export async function getPublicIssueUpdates(issueId: string) {
  const { data, error } = await supabase
    .from("issue_updates")
    .select("id, update_type, body, created_at")
    .eq("issue_id", issueId)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getPublicPolls() {
  const { data, error } = await supabase
    .from("polls")
    .select("id, question, slug, poll_options(id, label, vote_count)")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createPoll(question: string, optionLabels: string[], userId: string) {
  const slug = question.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert({ question: question.trim(), slug, creator_id: userId, is_public: false })
    .select("id")
    .single();
  if (pollError) throw pollError;

  const options = optionLabels.map((label, idx) => ({
    poll_id: poll.id,
    label: label.trim(),
    sort_order: idx
  }));
  const { error: optionsError } = await supabase.from("poll_options").insert(options);
  if (optionsError) throw optionsError;
  return poll;
}

export async function getPledgeCount() {
  const { count, error } = await supabase
    .from("pledges")
    .select("id", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}

export type AdminIssue = WebsiteIssue & {
  reporterId: string | null;
};

export type AdminIssueUpdate = {
  id: string;
  issueId: string;
  publicId: string | null;
  issueTitle: string | null;
  updateType: string;
  body: string;
  isPublic: boolean;
  createdAt: string;
};

export type AdminApprovalRequest = {
  id: string;
  fullName: string | null;
  displayName: string | null;
  email: string | null;
  role: AccountRole;
  requestedRole: AccountRole;
  roleApprovalStatus: RoleApprovalStatus;
  roleRequestedAt: string | null;
  createdAt: string | null;
};

export async function getAdminIssues(status?: IssueStatus) {
  let query = supabase
    .from("reports")
    .select(issueFields)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...mapIssue(row),
    reporterId: row.reporter_id ?? null
  })) as AdminIssue[];
}

export async function getRecentIssueUpdates(limit = 8) {
  const { data, error } = await supabase
    .from("issue_updates")
    .select(`
      id,
      issue_id,
      update_type,
      body,
      is_public,
      created_at,
      reports(public_id, summary)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row: Record<string, any>) => ({
    id: row.id,
    issueId: row.issue_id,
    publicId: row.reports?.public_id ?? null,
    issueTitle: row.reports?.summary ?? null,
    updateType: row.update_type,
    body: row.body,
    isPublic: Boolean(row.is_public),
    createdAt: row.created_at
  })) as AdminIssueUpdate[];
}

export async function getPendingAdminRequests() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, display_name, email, role, requested_role, role_approval_status, role_requested_at, created_at")
    .eq("requested_role", "admin")
    .eq("role_approval_status", "pending")
    .order("role_requested_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: Record<string, any>) => ({
    id: row.id,
    fullName: row.full_name ?? null,
    displayName: row.display_name ?? null,
    email: row.email ?? null,
    role: row.role as AccountRole,
    requestedRole: row.requested_role as AccountRole,
    roleApprovalStatus: row.role_approval_status as RoleApprovalStatus,
    roleRequestedAt: row.role_requested_at ?? null,
    createdAt: row.created_at ?? null
  })) as AdminApprovalRequest[];
}

export async function decideAdminRequest(profileId: string, decision: "approved" | "rejected") {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error("Please sign in as a superadmin.");

  const payload = decision === "approved"
    ? {
        role: "admin",
        role_approval_status: "approved",
        role_approved_at: new Date().toISOString(),
        role_approved_by: sessionData.session.user.id
      }
    : {
        role: "citizen",
        role_approval_status: "rejected",
        role_approved_at: new Date().toISOString(),
        role_approved_by: sessionData.session.user.id
      };

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", profileId)
    .eq("requested_role", "admin");

  if (error) throw error;
}

export async function getAdminIssue(issueId: string) {
  const { data, error } = await supabase
    .from("reports")
    .select(issueFields)
    .eq("id", issueId)
    .single();

  if (error) throw error;
  return { ...mapIssue(data), reporterId: data.reporter_id ?? null } as AdminIssue;
}

export async function updateIssueModeration(
  issueId: string,
  values: {
    status: IssueStatus;
    isPublic: boolean;
    isSensitive: boolean;
    indexable: boolean;
    authorityName: string;
    authorityReference: string;
    internalNotes: string;
    rejectionReason: string;
  }
) {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error("Please sign in as an admin.");

  const { data, error } = await supabase
    .from("reports")
    .update({
      status: values.status,
      rejection_reason: values.rejectionReason.trim() || null
    })
    .eq("id", issueId)
    .select(issueFields)
    .single();

  if (error) throw error;
  return mapIssue(data);
}

export async function addIssueUpdate(issueId: string, updateType: string, body: string, isPublic: boolean) {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error("Please sign in as an admin.");

  const { error } = await supabase.from("issue_updates").insert({
    issue_id: issueId,
    author_id: sessionData.session.user.id,
    update_type: updateType,
    body: body.trim(),
    is_public: isPublic
  });

  if (error) throw error;
}

export async function getContentPosts() {
  const { data, error } = await supabase
    .from("content_posts")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getPublishedContentBySlug(slug: string) {
  const { data, error } = await supabase
    .from("content_posts")
    .select("*")
    .eq("slug", slug)
    .not("published_at", "is", null)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function saveContentPost(values: Record<string, any>, id?: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error("Please sign in as an admin.");

  const { published, ...rest } = values;
  const payload = {
    ...rest,
    author_id: sessionData.session.user.id,
    published_at: published ? new Date().toISOString() : null,
    indexable: Boolean(values.indexable && published)
  };

  const request = id
    ? supabase.from("content_posts").update(payload).eq("id", id)
    : supabase.from("content_posts").insert(payload);
  const { error } = await request;
  if (error) throw error;
}

export function categoryLabel(category: string) {
  return (issueCategoryLabels as Record<string, string>)[category] ?? category.replaceAll("_", " ");
}
