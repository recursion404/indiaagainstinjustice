import type {
  IssueCategory,
  IssueSeverity,
  LocationKind,
  PublicIssue,
  TrafficCondition
} from "@citizens-first/shared";
import { supabase } from "./supabase";
import { makePublicId, makeSlug } from "./slug";

export type IssuePhotoDraft = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export type IssueDraft = {
  title: string;
  area: string;
  category: IssueCategory;
  customCategory?: string;
  severity: IssueSeverity;
  trafficCondition: TrafficCondition;
  publicSummary?: string;
  locationName?: string;
  locationKind?: LocationKind;
  suggestedSolution?: string;
  pincode?: string;
  wardNumber?: string;
  latitude?: number;
  longitude?: number;
  photo?: IssuePhotoDraft | null;
};

export async function submitTrafficIssue(draft: IssueDraft, userId: string | null) {
  const publicId = makePublicId();
  const slug = makeSlug([draft.area, draft.title, publicId]);

  const { data, error } = await supabase.rpc("submit_traffic_issue", {
    p_public_id:          publicId,
    p_reporter_id:        userId ?? null,
    p_title:              draft.title.trim(),
    p_slug:               slug,
    p_category:           draft.category,
    p_custom_category:    draft.customCategory?.trim() || null,
    p_traffic_condition:  draft.trafficCondition,
    p_area:               draft.area.trim(),
    p_public_summary:     draft.publicSummary?.trim() || "",
    p_location_name:      draft.locationName?.trim() || draft.area.trim(),
    p_location_kind:      draft.locationKind ?? "area",
    p_suggested_solution: draft.suggestedSolution?.trim() || null,
    p_pincode:            draft.pincode?.trim() || null,
    p_ward_number:        draft.wardNumber?.trim() || null,
    p_latitude:           draft.latitude ?? null,
    p_longitude:          draft.longitude ?? null
  });

  if (error) {
    throw error;
  }

  const row = (data as Array<{ id: string; public_id: string }>)[0];

  if (draft.photo) {
    await uploadIssuePhoto({
      issueId: row.id,
      publicId: row.public_id,
      photo: draft.photo,
      userId
    });
  }

  return row;
}


export async function fetchPublicIssues(): Promise<PublicIssue[]> {
  const { data, error } = await supabase
    .from("traffic_issues")
    .select(
      "id, public_id, title, slug, category, custom_category, status, severity, traffic_condition, area, city, public_summary, support_count, share_count, comment_count, confirmation_count, not_observed_count, created_at"
    )
    .eq("is_public", true)
    .eq("is_sensitive", false)
    .order("support_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    throw error;
  }

  return (data ?? []).map((issue) => ({
    id: issue.id,
    publicId: issue.public_id,
    title: issue.title,
    slug: issue.slug,
    category: issue.category,
    customCategory: issue.custom_category,
    status: issue.status,
    severity: issue.severity,
    trafficCondition: issue.traffic_condition,
    area: issue.area,
    city: "Pune",
    summary: issue.public_summary,
    supportCount: issue.support_count,
    shareCount: issue.share_count,
    commentCount: issue.comment_count ?? 0,
    confirmationCount: issue.confirmation_count ?? 0,
    notObservedCount: issue.not_observed_count ?? 0,
    createdAt: issue.created_at
  }));
}

export async function fetchMySupportedIssueIds(userId: string | null) {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("issue_supports")
    .select("issue_id")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((support) => support.issue_id as string);
}

export async function fetchMySharedIssueIds(userId: string | null) {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("issue_share_events")
    .select("issue_id")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((share) => share.issue_id as string);
}

export async function fetchMyIssues(userId: string | null): Promise<PublicIssue[]> {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("traffic_issues")
    .select(
      "id, public_id, title, slug, category, custom_category, status, severity, traffic_condition, area, city, public_summary, support_count, share_count, comment_count, confirmation_count, not_observed_count, created_at"
    )
    .eq("reporter_id", userId)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    throw error;
  }

  return (data ?? []).map((issue) => ({
    id: issue.id,
    publicId: issue.public_id,
    title: issue.title,
    slug: issue.slug,
    category: issue.category,
    customCategory: issue.custom_category,
    status: issue.status,
    severity: issue.severity,
    trafficCondition: issue.traffic_condition,
    area: issue.area,
    city: "Pune",
    summary: issue.public_summary,
    supportCount: issue.support_count,
    shareCount: issue.share_count,
    commentCount: issue.comment_count ?? 0,
    confirmationCount: issue.confirmation_count ?? 0,
    notObservedCount: issue.not_observed_count ?? 0,
    createdAt: issue.created_at
  }));
}

export async function fetchMyIssueConfirmations(userId: string | null) {
  if (!userId) {
    return {};
  }

  const { data, error } = await supabase
    .from("issue_confirmations")
    .select("issue_id, observed")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return Object.fromEntries((data ?? []).map((row) => [row.issue_id as string, Boolean(row.observed)]));
}

export async function confirmIssueObservation(issueId: string, observed: boolean, userId: string | null) {
  if (!userId) {
    throw new Error("Please sign in before confirming traffic conditions.");
  }

  const { error } = await supabase.from("issue_confirmations").upsert(
    {
      issue_id: issueId,
      user_id: userId,
      observed
    },
    { onConflict: "issue_id,user_id" }
  );

  if (error) {
    throw error;
  }
}

export async function supportIssue(issueId: string, userId: string | null) {
  if (!userId) {
    throw new Error("Please sign in before supporting an issue.");
  }

  const { error } = await supabase.from("issue_supports").insert({
    issue_id: issueId,
    user_id: userId
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("You have already supported this issue.");
    }

    throw error;
  }
}

export async function removeIssueSupport(issueId: string, userId: string | null) {
  if (!userId) {
    throw new Error("Please sign in before removing support.");
  }

  const { error } = await supabase
    .from("issue_supports")
    .delete()
    .eq("issue_id", issueId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function recordIssueShare(issueId: string, channel: string, userId: string | null) {
  if (!userId) {
    throw new Error("Please sign in before sharing an issue.");
  }

  const { error } = await supabase.from("issue_share_events").insert({
    issue_id: issueId,
    channel,
    user_id: userId
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("You have already shared this issue.");
    }

    throw error;
  }
}

type UploadIssuePhotoInput = {
  issueId: string;
  publicId: string;
  photo: IssuePhotoDraft;
  userId: string | null;
};

async function uploadIssuePhoto({ issueId, publicId, photo, userId }: UploadIssuePhotoInput) {
  const response = await fetch(photo.uri);
  const file = await response.arrayBuffer();
  const contentType = photo.mimeType ?? "image/jpeg";
  const extension = contentType.split("/")[1] ?? "jpg";
  const safeName = photo.fileName?.replace(/[^a-zA-Z0-9._-]/g, "-") ?? `${publicId}.${extension}`;
  const folder = userId || "anonymous";
  const storagePath = `${folder}/${issueId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("issue-photos")
    .upload(storagePath, file, {
      contentType,
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  const { error: photoError } = await supabase.from("issue_photos").insert({
    issue_id: issueId,
    storage_path: storagePath,
    alt_text: `Citizen photo for traffic report ${publicId}`,
    is_public: false
  });

  if (photoError) {
    throw photoError;
  }
}

export type IssueComment = {
  id: string;
  issueId: string;
  userId: string | null;
  authorName: string;
  body: string;
  createdAt: string;
};

export async function fetchIssueComments(issueId: string): Promise<IssueComment[]> {
  const { data, error } = await supabase
    .from("issue_comments")
    .select(`
      id,
      issue_id,
      user_id,
      author_name,
      body,
      created_at,
      profiles:user_id (full_name)
    `)
    .eq("issue_id", issueId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    issueId: row.issue_id,
    userId: row.user_id,
    authorName: row.profiles?.full_name || row.author_name || "Anonymous Citizen",
    body: row.body,
    createdAt: row.created_at
  }));
}

export async function postIssueComment(
  issueId: string,
  body: string,
  authorName: string | null,
  userId: string | null
): Promise<IssueComment> {
  const { data, error } = await supabase
    .from("issue_comments")
    .insert({
      issue_id: issueId,
      user_id: userId,
      author_name: authorName?.trim() || null,
      body: body.trim()
    })
    .select(`
      id,
      issue_id,
      user_id,
      author_name,
      body,
      created_at,
      profiles:user_id (full_name)
    `)
    .single();

  if (error) {
    throw error;
  }

  const row = data as any;
  return {
    id: row.id,
    issueId: row.issue_id,
    userId: row.user_id,
    authorName: row.profiles?.full_name || row.author_name || "Anonymous Citizen",
    body: row.body,
    createdAt: row.created_at
  };
}
