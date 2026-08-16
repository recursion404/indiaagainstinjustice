import type { IssueCategory, PublicIssue } from "@citizens-first/shared";

export const sampleIssues: PublicIssue[] = [
  {
    id: "1",
    publicId: "PUN-001245",
    title: "Heavy traffic near Baner main road",
    slug: "baner-heavy-traffic-pun-001245",
    category: "traffic_jam",
    status: "published",
    area: "Baner",
    city: "Pune",
    summary: "Citizen-reported congestion near Baner main road during evening peak hours.",
    supportCount: 182,
    shareCount: 34,
    createdAt: "2026-08-15T08:00:00.000Z"
  },
  {
    id: "2",
    publicId: "PUN-001246",
    title: "Signal timing issue at Wakad junction",
    slug: "wakad-signal-issue-pun-001246",
    category: "signal_issue",
    status: "under_review",
    area: "Wakad",
    city: "Pune",
    summary: "Citizens report long wait times and spillover traffic at the junction.",
    supportCount: 141,
    shareCount: 19,
    createdAt: "2026-08-14T11:00:00.000Z"
  },
  {
    id: "3",
    publicId: "PUN-001247",
    title: "Illegal parking blocking PMPML stop",
    slug: "kothrud-pmpml-stop-parking-pun-001247",
    category: "illegal_parking",
    status: "published",
    area: "Kothrud",
    city: "Pune",
    summary: "Parked vehicles are forcing buses to stop away from the marked public stop.",
    supportCount: 96,
    shareCount: 12,
    createdAt: "2026-08-13T09:30:00.000Z"
  }
];

export const quickCategories: Array<{ label: string; value: IssueCategory }> = [
  { label: "Traffic jam", value: "traffic_jam" },
  { label: "Road problem", value: "road_damage" },
  { label: "Signal issue", value: "signal_issue" },
  { label: "Illegal parking", value: "illegal_parking" },
  { label: "Public transport", value: "public_transport" }
];
