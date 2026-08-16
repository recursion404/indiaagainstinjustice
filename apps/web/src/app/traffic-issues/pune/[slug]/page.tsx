import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { getPublicIssueBySlug, getPublicIssueUpdates } from "@/lib/data";
import { IssueEngagement } from "./IssueEngagement";

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
        <MapPin size={16} /> {issue.area}, {issue.city} | {issue.publicId}
      </p>
      <section className="card">
        <h2>Public Summary</h2>
          <p>{issue.summary}</p>
          <IssueEngagement issueId={issue.id} initialSupportCount={issue.supportCount} initialShareCount={issue.shareCount} />
      </section>
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
