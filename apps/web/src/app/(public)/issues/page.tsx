import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, MapPin } from "lucide-react";
import { categoryLabel, getPublicIssues } from "@/lib/data";
import { Badge, ButtonLink, EmptyState, PageShell, SectionHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Public Civic Issues in India",
  description:
    "Browse reviewed citizen reports across India, including public status, location, confirmations, and accountability updates."
};

const conditionRank = {
  severe: 0,
  heavy: 1,
  moderate: 2,
  normal: 3,
  cleared: 4
};

export default async function IssuesPage() {
  const issues = (await getPublicIssues(100))
    .filter((issue) => issue.status !== "resolved" && issue.status !== "rejected")
    .sort((a, b) => {
      const aRank = conditionRank[a.trafficCondition ?? "heavy"];
      const bRank = conditionRank[b.trafficCondition ?? "heavy"];
      if (aRank !== bRank) return aRank - bRank;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <PageShell>
      <SectionHeader
        eyebrow="Public issue registry"
        title="Public issues"
        description="Reviewed citizen reports become privacy-safe public records that communities can support, share, verify, and track."
        action={<ButtonLink href="/report">Submit report</ButtonLink>}
      />

      {issues.length ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {issues.map((issue) => {
            const isUrgent = issue.trafficCondition === "severe" || issue.severity === "critical";
            return (
              <article className="group flex flex-col rounded-lg border border-border bg-card p-6 shadow-sm transition-colors hover:border-primary/30" key={issue.id}>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <Badge tone={isUrgent ? "urgent" : "muted"}>{isUrgent ? "urgent" : issue.status.replaceAll("_", " ")}</Badge>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{issue.publicId}</span>
                </div>

                <h2 className="mb-2 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                  {issue.title}
                </h2>
                <p className="mb-3 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                  <MapPin size={14} className="text-muted-foreground" /> {issue.locationName || issue.townVillage}, {issue.district || issue.state}
                </p>
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {categoryLabel(issue.category)} · {issue.severity ?? "moderate"} severity
                </p>
                <p className="mb-6 line-clamp-3 text-sm font-medium leading-relaxed text-muted-foreground">{issue.summary}</p>

                <div className="mt-auto space-y-4 border-t border-border pt-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/70 p-2">
                      <CheckCircle2 size={14} className="mx-auto mb-1 text-secondary" />
                      <strong className="block text-xs text-foreground">{issue.confirmationCount ?? 0}</strong>
                      <span className="text-[9px] font-bold uppercase text-muted-foreground">confirmed</span>
                    </div>
                    <div className="rounded-lg bg-muted/70 p-2">
                      <AlertTriangle size={14} className="mx-auto mb-1 text-primary" />
                      <strong className="block text-xs text-foreground">{issue.notObservedCount ?? 0}</strong>
                      <span className="text-[9px] font-bold uppercase text-muted-foreground">not seen</span>
                    </div>
                    <div className="rounded-lg bg-muted/70 p-2">
                      <Clock size={14} className="mx-auto mb-1 text-accent" />
                      <strong className="block text-xs text-foreground">
                        {new Date(issue.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </strong>
                      <span className="text-[9px] font-bold uppercase text-muted-foreground">reported</span>
                    </div>
                  </div>

                  <Link href={`/issues/${issue.slug}`} className="inline-flex w-full items-center justify-center rounded-md bg-muted py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-primary/10 hover:text-primary">
                    Open public record
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No public reports yet" description="Reviewed citizen reports will appear here after moderation." action={<ButtonLink href="/report">Submit the first report</ButtonLink>} />
      )}
    </PageShell>
  );
}
