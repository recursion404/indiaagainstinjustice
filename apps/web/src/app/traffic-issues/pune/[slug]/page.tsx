import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";

const issue = {
  publicId: "PUN-001245",
  title: "Pune Traffic Jam at Baner",
  slug: "baner-heavy-traffic-pun-001245",
  area: "Baner",
  status: "Citizen report",
  supportCount: 182,
  shareCount: 34,
  summary:
    "Citizen-reported traffic congestion at Baner, Pune. Public status, citizen support and action records will appear here for complaint PUN-001245."
};

type PageProps = {
  params: { slug: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = params;

  if (slug !== issue.slug) {
    return {};
  }

  return {
    title: "Pune Traffic Jam at Baner | Citizen Report PUN-001245",
    description:
      "Citizen-reported traffic congestion at Baner, Pune. See public status, citizen support and action recorded for complaint PUN-001245.",
    alternates: {
      canonical: `/traffic-issues/pune/${issue.slug}`
    }
  };
}

export default async function PublicIssuePage({ params }: PageProps) {
  const { slug } = params;

  if (slug !== issue.slug) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Report",
    name: issue.title,
    identifier: issue.publicId,
    about: "Traffic congestion",
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
      <span className="status">{issue.status}</span>
      <h1>{issue.title}</h1>
      <p className="issueMeta muted">
        <MapPin size={16} /> {issue.area}, Pune | {issue.publicId}
      </p>
      <section className="card">
        <h2>Public Summary</h2>
        <p>{issue.summary}</p>
        <div className="stats">
          <div className="stat">
            <strong>{issue.supportCount}</strong>
            <span>citizen supports</span>
          </div>
          <div className="stat">
            <strong>{issue.shareCount}</strong>
            <span>social shares</span>
          </div>
        </div>
      </section>
    </main>
  );
}
