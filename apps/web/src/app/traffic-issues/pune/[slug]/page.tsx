import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { getPublicIssueBySlug, getPublicIssueUpdates } from "@/lib/data";
import { IssueEngagement } from "./IssueEngagement";
import { IssueComments } from "./IssueComments";

type PageProps = {
  params: { slug: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = params;

  const issue = await getPublicIssueBySlug(slug);
  if (!issue) {
    return {};
  }

  return {
    title: issue.title,
    description: issue.summary,
    alternates: {
      canonical: `/traffic-issues/pune/${issue.slug}`
    },
    robots: issue.indexable ? undefined : { index: false, follow: true }
  };
}

export default async function PublicIssuePage({ params }: PageProps) {
  const { slug } = params;

  const issue = await getPublicIssueBySlug(slug);
  if (!issue) {
    notFound();
  }

  const updates = await getPublicIssueUpdates(issue.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Report",
    name: issue.title,
    identifier: issue.publicId,
    about: issue.category,
    severity: issue.severity,
    areaServed: {
      "@type": "City",
      name: "Pune"
    }
  };

  return (
    <main className="container band">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <span className="status">{issue.status.replaceAll("_", " ")}</span>
      <h1>{issue.title}</h1>
      <p className="issueMeta muted">
        <MapPin size={16} /> {issue.locationName || issue.area}, {issue.city} | {issue.publicId}
      </p>
      <section className="card">
        <h2>Public Summary</h2>
        <p>{issue.summary}</p>
        <div className="stats">
          <div className="stat"><strong>{issue.trafficCondition ?? "heavy"}</strong><span>traffic condition</span></div>
          <div className="stat"><strong>{issue.locationKind ?? "area"}</strong><span>location type</span></div>
        </div>
        {issue.suggestedSolution ? (
          <div className="privatePanel">
            <strong>Citizen suggested solution</strong>
            <p>{issue.suggestedSolution}</p>
          </div>
        ) : null}
        <IssueEngagement
          issueId={issue.id}
          issueTitle={issue.title}
          initialConfirmationCount={issue.confirmationCount ?? 0}
          initialNotObservedCount={issue.notObservedCount ?? 0}
          initialShareCount={issue.shareCount}
          initialSupportCount={issue.supportCount}
        />
      </section>
      <IssueComments issueId={issue.id} initialCount={issue.commentCount ?? 0} />
      <section className="band">
        <h2>Public action record</h2>
        {updates.length === 0 ? <p className="muted">No public action updates have been recorded yet.</p> : null}
        <div className="timeline">
          {updates.map((update) => (
            <article className="card" key={update.id}>
              <span className="status">{update.update_type.replaceAll("_", " ")}</span>
              <p>{update.body}</p>
              <small className="muted">{new Date(update.created_at).toLocaleDateString("en-IN")}</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
