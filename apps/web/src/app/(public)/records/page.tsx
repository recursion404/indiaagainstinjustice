import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, Share2, ThumbsUp } from "lucide-react";
import { categoryLabel, getPublicIssues } from "@/lib/data";
import { Badge, EmptyState, PageShell, SectionHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Public Civic Records in India",
  description:
    "Explore privacy-safe public records for verified citizen reports, civic problems, and accountability actions across India."
};

export default async function RecordsPage() {
  const issues = await getPublicIssues();

  return (
    <PageShell>
      <SectionHeader
        eyebrow="Records archive"
        title="Long-term civic records"
        description="Browse approved issue pages kept as public-reference records for tracking, sharing, and accountability over time."
      />

      {issues.length ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {issues.map((issue) => (
            <article className="group flex flex-col rounded-lg border border-border bg-card p-6 shadow-sm transition-colors hover:border-primary/30" key={issue.id}>
              <div className="mb-4 flex items-center justify-between gap-2">
                <Badge tone="muted">{issue.status.replaceAll("_", " ")}</Badge>
                <Badge tone={issue.severity === "critical" ? "urgent" : "default"}>{issue.severity ?? "moderate"}</Badge>
              </div>

              <h2 className="mb-2 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">{issue.title}</h2>
              <p className="mb-4 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                <MapPin size={14} className="text-muted-foreground" /> {issue.locationName || issue.townVillage}, {issue.district || issue.state}
              </p>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{categoryLabel(issue.category)}</p>
              <p className="mb-6 line-clamp-3 text-sm font-medium leading-relaxed text-muted-foreground">{issue.summary}</p>

              <div className="mt-auto">
                <div className="mb-4 flex items-center gap-4 border-y border-border py-3 text-xs font-bold text-muted-foreground">
                  <span className="flex items-center gap-1"><ThumbsUp size={14} className="text-muted-foreground" /> {issue.supportCount} supports</span>
                  <span className="flex items-center gap-1"><Share2 size={14} className="text-muted-foreground" /> {issue.shareCount} shares</span>
                </div>
                <Link href={`/issues/${issue.slug}`} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-muted px-4 py-2.5 text-xs font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary">
                  View full record <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No public records yet" description="Citizen reports appear here once they have been reviewed and published." />
      )}
    </PageShell>
  );
}
