export const issueCategories = [
  "road_work",
  "no_traffic_police_on_signal",
  "accident",
  "broken_signal",
  "vip_convoy",
  "signal_issue",
  "illegal_parking",
  "wrong_side_driving",
  "encroachment",
  "waterlogging",
  "pothole",
  "incomplete_road",
  "diversion",
  "public_event",
  "people_waiting_for_bus_on_road",
  "heavy_vehicle_movement",
  "signal_timing",
  "pedestrian_crossing",
  "other"
] as const;

export const issueCategoryLabels: Record<(typeof issueCategories)[number], string> = {
  road_work: "Road work In Progress",
  no_traffic_police_on_signal: "No Traffic Police on Signal",
  accident: "Accident",
  broken_signal: "Broken traffic signal",
  vip_convoy: "VIP convoy",
  signal_issue: "Signal issue/Not Working",
  illegal_parking: "Illegal Parking On Road side",
  wrong_side_driving: "Wrong-side driving",
  encroachment: "Encroachment On Road/Footpath",
  waterlogging: "Waterlogging",
  pothole: "Potholes",
  incomplete_road: "InComplete Road",
  diversion: "Diversion",
  public_event: "Public Event/Rally",
  people_waiting_for_bus_on_road: "People waiting for Bus on Road",
  heavy_vehicle_movement: "Heavy vehicle movement",
  signal_timing: "Signal timing",
  pedestrian_crossing: "Pedestrian crossing",
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

export type IssueStatus = (typeof issueStatuses)[number];
export type IssueSeverity = (typeof issueSeverities)[number];
export type TrafficCondition = (typeof trafficConditions)[number];
export type LocationKind = (typeof locationKinds)[number];

export type CivicCategory = {
  slug: string;
  label: string;
  icon?: string | null;
  isActive: boolean;
  createdAt?: string;
};

export type PublicIssue = {
  id: string;
  publicId: string;
  title: string;
  slug: string;
  category: string; // References categories.slug
  customCategory?: string | null;
  status: IssueStatus;
  severity?: IssueSeverity;
  trafficCondition?: TrafficCondition;
  
  // Dynamic geography
  state: string;
  district?: string | null;
  townVillage: string;
  pincode: string;

  summary: string;
  locationName?: string | null;
  locationKind?: LocationKind | null;
  suggestedSolution?: string | null;
  supportCount: number;
  shareCount: number;
  commentCount?: number;
  confirmationCount?: number;
  notObservedCount?: number;
  createdAt: string;
};
