import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, MapPin } from "lucide-react";
import { categoryLabel, getPublicIssues } from "@/lib/data";

export const metadata: Metadata = {
  title: "Live Pune Traffic Reports",
  description:
    "See reviewed citizen traffic reports for Pune, including current condition, severity, confirmations and not-observed signals."
};

const conditionRank = {
  severe: 0,
  heavy: 1,
  moderate: 2,
  normal: 3,
  cleared: 4
};

export default async function LiveTrafficPage() {
  const issues = (await getPublicIssues(100))
    .filter((issue) => issue.status !== "resolved" && issue.status !== "rejected")
    .sort((a, b) => {
      const aRank = conditionRank[a.trafficCondition ?? "heavy"];
      const bRank = conditionRank[b.trafficCondition ?? "heavy"];
      if (aRank !== bRank) return aRank - bRank;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const liveReports = issues.filter((issue) => issue.trafficCondition !== "cleared").length;
  const verifiedReports = issues.filter((issue) =>
    ["verified", "assigned", "action_started", "action_taken", "resolved"].includes(issue.status)
  ).length;
  const severeReports = issues.filter((issue) => issue.trafficCondition === "severe").length;

  return (
    <main className="container band">
      <div className="sectionHeader">
        <div>
          <span className="status">Live Traffic</span>
          <h1>Current Citizen-Reported Pune Traffic</h1>
        </div>
        <Link className="button" href="/report-traffic-problem">Report traffic</Link>
      </div>

      <div className="stats">
        <div className="stat"><strong>{liveReports}</strong><span>live reports</span></div>
        <div className="stat"><strong>{verifiedReports}</strong><span>verified reports</span></div>
        <div className="stat"><strong>{severeReports}</strong><span>severe reports</span></div>
      </div>

      <div className="grid">
        {issues.map((issue) => (
          <article className="card" key={issue.id}>
            <span className="status">{issue.trafficCondition ?? "heavy"} traffic</span>
            <h2>{issue.title}</h2>
            <p className="issueMeta">
              <MapPin size={16} /> {issue.locationName || issue.area}, {issue.city}
            </p>
            <p className="muted">
              {categoryLabel(issue.category)} · {issue.severity ?? "moderate"} severity · {issue.status.replaceAll("_", " ")}
            </p>
            <p>{issue.summary}</p>
            <div className="stats">
              <div className="stat"><CheckCircle2 size={18} /><strong>{issue.confirmationCount ?? 0}</strong><span>confirmed</span></div>
              <div className="stat"><AlertTriangle size={18} /><strong>{issue.notObservedCount ?? 0}</strong><span>not observed</span></div>
              <div className="stat"><Clock size={18} /><strong>{new Date(issue.createdAt).toLocaleDateString("en-IN")}</strong><span>reported</span></div>
            </div>
            <Link href={`/traffic-issues/pune/${issue.slug}`}>Open report</Link>
          </article>
        ))}
        {issues.length === 0 ? (
          <article className="card">
            <h2>No live public traffic reports yet</h2>
            <p>Reviewed citizen reports will appear here after moderation.</p>
          </article>
        ) : null}
      </div>
    </main>
  );
}
