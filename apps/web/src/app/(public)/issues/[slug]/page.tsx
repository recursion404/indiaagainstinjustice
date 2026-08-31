import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, Card, PageShell, SectionHeader, StatCard } from "@/components/ui";
import { categoryLabel, getPublicIssueBySlug } from "@/lib/data";
import { siteConfig } from "@/lib/site";
import IssueActions from "./IssueActions";
import { IssueComments } from "./IssueComments";

type IssuePageProps = {
  params: {
    slug: string;
  };
};

export async function generateMetadata({ params }: IssuePageProps): Promise<Metadata> {
  const issue = await getPublicIssueBySlug(params.slug);

  if (!issue) {
    return {
      title: "Issue not found | India Against Injustice",
    };
  }

  return {
    title: `${issue.title} | India Against Injustice`,
    description: issue.summary,
    alternates: {
      canonical: `${siteConfig.url}/issues/${issue.slug}`,
    },
    openGraph: {
      title: issue.title,
      description: issue.summary,
      url: `${siteConfig.url}/issues/${issue.slug}`,
      type: "article",
    },
  };
}

export default async function IssuePage({ params }: IssuePageProps) {
  const issue = await getPublicIssueBySlug(params.slug);

  if (!issue) {
    notFound();
  }

  const publicUrl = `${siteConfig.url}/issues/${issue.slug}`;
  const locationParts = [
    issue.locationName,
    issue.townVillage,
    issue.district,
    issue.state,
  ].filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: issue.title,
    description: issue.summary,
    url: publicUrl,
    datePublished: issue.createdAt,
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    about: issue.category,
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SectionHeader
        eyebrow="Public Issue"
        title={issue.title}
        description={issue.summary}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="orange">{categoryLabel(issue.category)}</Badge>
              {issue.customCategory ? <Badge tone="slate">{issue.customCategory}</Badge> : null}
              <Badge tone="green">{issue.status.replaceAll("_", " ")}</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="Citizen supports" value={issue.supportCount ?? 0} />
              <StatCard label="Public shares" value={issue.shareCount ?? 0} />
            </div>

            <div className="rounded-lg border border-border bg-muted p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Location
              </h2>
              <p className="mt-3 text-lg font-bold text-foreground">
              {locationParts.length > 0 ? locationParts.join(", ") : "India"}
              </p>
              {issue.pincode ? (
                <p className="mt-1 text-sm font-semibold text-muted-foreground">
                  Pincode: {issue.pincode}
                </p>
              ) : null}
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Public summary
            </h2>
            <p className="text-lg leading-8 text-foreground">{issue.summary}</p>
          </Card>

          <IssueComments issueId={issue.id} />
        </div>

        <aside className="space-y-6">
          <Card className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Public ID</h2>
            <p className="rounded-md bg-foreground px-4 py-3 font-mono text-sm font-bold text-primary-foreground">
              {issue.publicId}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              This is the public-safe record created after review. Private citizen contact
              details are not shown here.
            </p>
          </Card>

          <IssueActions issueTitle={issue.title} issueUrl={publicUrl} />
        </aside>
      </div>
    </PageShell>
  );
}
