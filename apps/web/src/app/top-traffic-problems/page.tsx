import type { Metadata } from "next";
import Link from "next/link";
import { getPublicIssues, categoryLabel } from "@/lib/data";

export const metadata: Metadata = {
  title: "Top Traffic Problems in Pune | Citizen Reports & Support",
  description:
    "See the traffic problems most reported and supported by Pune citizens, including location, public status and authority assignment."
};

export default async function TopTrafficProblemsPage() {
  const issues = await getPublicIssues();

  return (
    <main className="container band">
      <div className="sectionHeader">
        <h1>Top Traffic Problems in Pune</h1>
        <span className="status">Citizen reports</span>
      </div>
      <div className="grid">
        {issues.map((issue) => (
          <article className="card" key={issue.id}>
            <span className="status">{issue.status.replaceAll("_", " ")}</span>
            <h2>{issue.title}</h2>
            <p className="muted">{issue.area}, {issue.city} · {categoryLabel(issue.category)}</p>
            <p>{issue.summary}</p>
            <div className="stats">
              <div className="stat"><strong>{issue.supportCount}</strong><span>supports</span></div>
              <div className="stat"><strong>{issue.shareCount}</strong><span>shares</span></div>
            </div>
            <Link href={`/traffic-issues/pune/${issue.slug}`}>View issue</Link>
          </article>
        ))}
        {issues.length === 0 ? <article className="card"><h2>No public issues yet</h2><p>Reports appear after review and publication.</p></article> : null}
      </div>
    </main>
  );
}
