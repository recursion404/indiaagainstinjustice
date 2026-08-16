export const issueCategories = [
  "traffic_jam",
  "road_damage",
  "signal_issue",
  "illegal_parking",
  "public_transport",
  "unsafe_junction",
  "other"
] as const;

export const issueStatuses = [
  "submitted",
  "under_review",
  "published",
  "assigned",
  "action_recorded",
  "citizen_verified",
  "resolved",
  "rejected"
] as const;

export const puneLocations = [
  "baner",
  "balewadi",
  "wakad",
  "hinjewadi",
  "aundh",
  "kothrud",
  "viman-nagar"
] as const;

export type IssueCategory = (typeof issueCategories)[number];
export type IssueStatus = (typeof issueStatuses)[number];
export type PuneLocationSlug = (typeof puneLocations)[number];

export type PublicIssue = {
  id: string;
  publicId: string;
  title: string;
  slug: string;
  category: IssueCategory;
  status: IssueStatus;
  area: string;
  city: "Pune";
  summary: string;
  supportCount: number;
  shareCount: number;
  createdAt: string;
};
