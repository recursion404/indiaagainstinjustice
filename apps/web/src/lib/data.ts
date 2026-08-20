import { issueCategoryLabels, type IssueCategory, type IssueStatus, type PublicIssue } from "@citizens-first/shared";
import { supabase } from "./supabase";

export type WebsiteIssue = PublicIssue & {
  trafficCondition: PublicIssue["trafficCondition"];
  severity: PublicIssue["severity"];
  locationName: string | null;
  locationKind: PublicIssue["locationKind"];
  suggestedSolution: string | null;
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
};

const issueFields =
  "id, public_id, reporter_id, title, slug, category, status, severity, traffic_condition, area, city, public_summary, location_name, location_kind, suggested_solution, citizen_landmark, private_address, pincode, ward_number, support_count, share_count, confirmation_count, not_observed_count, is_public, is_sensitive, indexable, authority_name, authority_reference, internal_notes, rejection_reason, published_at, created_at, updated_at";

function mapIssue(row: Record<string, any>): WebsiteIssue {
  return {
    id: row.id,
    publicId: row.public_id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    status: row.status,
    severity: row.severity,
    trafficCondition: row.traffic_condition,
    area: row.area,
    city: row.city ?? "Pune",
    summary: row.public_summary,
    locationName: row.location_name,
    locationKind: row.location_kind,
    suggestedSolution: row.suggested_solution,
    supportCount: row.support_count ?? 0,
    shareCount: row.share_count ?? 0,
    confirmationCount: row.confirmation_count ?? 0,
    notObservedCount: row.not_observed_count ?? 0,
    createdAt: row.created_at,
    isPublic: row.is_public,
    isSensitive: row.is_sensitive,
    indexable: row.indexable,
    privateAddress: row.private_address,
    citizenLandmark: row.citizen_landmark,
    pincode: row.pincode,
    wardNumber: row.ward_number,
    authorityName: row.authority_name,
    authorityReference: row.authority_reference,
    internalNotes: row.internal_notes,
    rejectionReason: row.rejection_reason,
    publishedAt: row.published_at
  };
}

export async function getPublicIssues(limit = 50) {
  const { data, error } = await supabase
    .from("traffic_issues")
    .select(issueFields)
    .eq("is_public", true)
    .eq("is_sensitive", false)
    .neq("status", "rejected")
    .order("support_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapIssue);
}

export async function getPublicIssueBySlug(slug: string) {
  const { data, error } = await supabase
    .from("traffic_issues")
    .select(issueFields)
    .eq("slug", slug)
    .eq("is_public", true)
    .eq("is_sensitive", false)
    .neq("status", "rejected")
    .maybeSingle();

  if (error) throw error;
  return data ? mapIssue(data) : null;
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

export async function getAdminIssues(status?: IssueStatus) {
  let query = supabase
    .from("traffic_issues")
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

export async function getAdminIssue(issueId: string) {
  const { data, error } = await supabase
    .from("traffic_issues")
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

  const publishable = values.status !== "rejected" && values.isPublic && !values.isSensitive;
  const { data, error } = await supabase
    .from("traffic_issues")
    .update({
      status: values.status,
      is_public: publishable,
      is_sensitive: values.isSensitive,
      indexable: publishable && values.indexable,
      authority_name: values.authorityName.trim() || null,
      authority_reference: values.authorityReference.trim() || null,
      internal_notes: values.internalNotes.trim() || null,
      rejection_reason: values.rejectionReason.trim() || null,
      published_at: publishable ? new Date().toISOString() : null,
      published_by: publishable ? sessionData.session.user.id : null
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

  const payload = {
    ...values,
    author_id: sessionData.session.user.id,
    published_at: values.published ? new Date().toISOString() : null,
    indexable: Boolean(values.indexable && values.published)
  };
  delete payload.published;

  const request = id
    ? supabase.from("content_posts").update(payload).eq("id", id)
    : supabase.from("content_posts").insert(payload);
  const { error } = await request;
  if (error) throw error;
}

export function categoryLabel(category: IssueCategory) {
  return issueCategoryLabels[category] ?? category.replaceAll("_", " ");
}
