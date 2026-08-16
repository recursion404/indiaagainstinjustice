import type { IssueCategory, PublicIssue } from "@citizens-first/shared";
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
  publicSummary: string;
  privateAddress?: string;
  latitude?: number;
  longitude?: number;
  photo?: IssuePhotoDraft | null;
};

export async function submitTrafficIssue(draft: IssueDraft) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Please sign in before submitting a traffic report.");
  }

  const publicId = makePublicId();
  const slug = makeSlug([draft.area, draft.title, publicId]);

  const { data, error } = await supabase
    .from("traffic_issues")
    .insert({
      public_id: publicId,
      reporter_id: user.id,
      title: draft.title.trim(),
      slug,
      category: draft.category,
      area: draft.area.trim(),
      public_summary: draft.publicSummary.trim(),
      private_address: draft.privateAddress?.trim() || null,
      latitude: draft.latitude ?? null,
      longitude: draft.longitude ?? null
    })
    .select("id, public_id")
    .single();

  if (error) {
    throw error;
  }

  if (draft.photo) {
    await uploadIssuePhoto({
      issueId: data.id,
      publicId: data.public_id,
      photo: draft.photo,
      userId: user.id
    });
  }

  return data;
}

export async function fetchPublicIssues(): Promise<PublicIssue[]> {
  const { data, error } = await supabase
    .from("traffic_issues")
    .select(
      "id, public_id, title, slug, category, status, area, city, public_summary, support_count, share_count, created_at"
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
    status: issue.status,
    area: issue.area,
    city: "Pune",
    summary: issue.public_summary,
    supportCount: issue.support_count,
    shareCount: issue.share_count,
    createdAt: issue.created_at
  }));
}

export async function supportIssue(issueId: string) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Please sign in before supporting an issue.");
  }

  const { error } = await supabase.from("issue_supports").insert({
    issue_id: issueId,
    user_id: user.id
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("You have already supported this issue.");
    }

    throw error;
  }
}

type UploadIssuePhotoInput = {
  issueId: string;
  publicId: string;
  photo: IssuePhotoDraft;
  userId: string;
};

async function uploadIssuePhoto({ issueId, publicId, photo, userId }: UploadIssuePhotoInput) {
  const response = await fetch(photo.uri);
  const file = await response.arrayBuffer();
  const contentType = photo.mimeType ?? "image/jpeg";
  const extension = contentType.split("/")[1] ?? "jpg";
  const safeName = photo.fileName?.replace(/[^a-zA-Z0-9._-]/g, "-") ?? `${publicId}.${extension}`;
  const storagePath = `${userId}/${issueId}/${Date.now()}-${safeName}`;

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
