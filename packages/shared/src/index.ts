export const issueCategories = [
  "traffic_jam",
  "road_bottleneck",
  "road_work",
  "accident",
  "broken_signal",
  "vip_convoy",
  "road_damage",
  "signal_issue",
  "illegal_parking",
  "wrong_side_driving",
  "encroachment",
  "waterlogging",
  "pothole",
  "missing_road_link",
  "road_widening_required",
  "diversion",
  "public_event",
  "bus_pmpml_issue",
  "heavy_vehicle_movement",
  "signal_timing",
  "pedestrian_crossing",
  "public_transport",
  "unsafe_junction",
  "other"
] as const;

export const issueCategoryLabels: Record<(typeof issueCategories)[number], string> = {
  traffic_jam: "Traffic jam",
  road_bottleneck: "Road bottleneck",
  road_work: "Road work",
  accident: "Accident",
  broken_signal: "Broken traffic signal",
  vip_convoy: "VIP convoy",
  road_damage: "Road problem",
  signal_issue: "Signal issue",
  illegal_parking: "Illegal parking",
  wrong_side_driving: "Wrong-side driving",
  encroachment: "Encroachment",
  waterlogging: "Waterlogging",
  pothole: "Pothole",
  missing_road_link: "Missing road link",
  road_widening_required: "Road widening required",
  diversion: "Diversion",
  public_event: "Public event",
  bus_pmpml_issue: "Bus/PMPML issue",
  heavy_vehicle_movement: "Heavy vehicle movement",
  signal_timing: "Signal timing",
  pedestrian_crossing: "Pedestrian crossing",
  public_transport: "Public transport",
  unsafe_junction: "Unsafe junction",
  other: "Other"
};

export const issueStatuses = [
  "submitted",
  "under_review",
  "verified",
  "published",
  "assigned",
  "action_started",
  "action_taken",
  "action_recorded",
  "citizen_verified",
  "resolved",
  "rejected",
  "duplicate",
  "insufficient_information",
  "reopened"
] as const;

export const issueSeverities = ["low", "moderate", "high", "critical"] as const;

export const trafficConditions = ["normal", "moderate", "heavy", "severe", "cleared"] as const;

export const locationKinds = ["chowk", "road", "area", "landmark"] as const;

export const puneLocations = [
  "baner",
  "balewadi",
  "wakad",
  "hinjewadi",
  "aundh",
  "kothrud",
  "viman-nagar",
  "baner-radha-chowk",
  "yashada-chowk",
  "balewadi-high-street",
  "wakad-bridge"
] as const;

export type IssueCategory = (typeof issueCategories)[number];
export type IssueStatus = (typeof issueStatuses)[number];
export type IssueSeverity = (typeof issueSeverities)[number];
export type TrafficCondition = (typeof trafficConditions)[number];
export type LocationKind = (typeof locationKinds)[number];
export type PuneLocationSlug = (typeof puneLocations)[number];

export type PublicIssue = {
  id: string;
  publicId: string;
  title: string;
  slug: string;
  category: IssueCategory;
  status: IssueStatus;
  severity?: IssueSeverity;
  trafficCondition?: TrafficCondition;
  area: string;
  city: "Pune";
  summary: string;
  locationName?: string | null;
  locationKind?: LocationKind | null;
  suggestedSolution?: string | null;
  supportCount: number;
  shareCount: number;
  confirmationCount?: number;
  notObservedCount?: number;
  createdAt: string;
};
