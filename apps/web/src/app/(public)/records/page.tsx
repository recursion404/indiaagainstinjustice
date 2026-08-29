import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, Share2, ThumbsUp } from "lucide-react";
import { categoryLabel, getPublicIssues } from "@/lib/data";
import { Badge, EmptyState, PageShell, SectionHeader } from "@/components/ui";

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
        eyebrow="Public directory"
        title="Public civic records"
        description="Browse approved reports and accountability records by location, category, support, and public status."
      />

      {issues.length ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {issues.map((issue) => (
            <article className="group flex flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-950/5" key={issue.id}>
              <div className="mb-4 flex items-center justify-between gap-2">
                <Badge tone="muted">{issue.status.replaceAll("_", " ")}</Badge>
                <Badge tone={issue.severity === "critical" ? "urgent" : "default"}>{issue.severity ?? "moderate"}</Badge>
              </div>

              <h2 className="mb-2 text-lg font-black leading-snug text-slate-950 transition-colors group-hover:text-orange-600">{issue.title}</h2>
              <p className="mb-4 flex items-center gap-1 text-xs font-semibold text-slate-500">
                <MapPin size={14} className="text-slate-400" /> {issue.locationName || issue.townVillage}, {issue.district || issue.state}
              </p>
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">{categoryLabel(issue.category)}</p>
              <p className="mb-6 line-clamp-3 text-sm font-medium leading-relaxed text-slate-600">{issue.summary}</p>

              <div className="mt-auto">
                <div className="mb-4 flex items-center gap-4 border-y border-slate-50 py-3 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1"><ThumbsUp size={14} className="text-slate-400" /> {issue.supportCount} supports</span>
                  <span className="flex items-center gap-1"><Share2 size={14} className="text-slate-400" /> {issue.shareCount} shares</span>
                </div>
                <Link href={`/issues/${issue.slug}`} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-black text-slate-700 transition-all hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700">
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
