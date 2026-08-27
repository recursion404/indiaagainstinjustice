import type { Metadata } from "next";
import Link from "next/link";
import { getPublicIssues, categoryLabel } from "@/lib/data";
import { MapPin, ArrowRight, ThumbsUp, Share2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Top Traffic Problems in Pune | Citizen Reports & Support",
  description:
    "See the traffic problems most reported and supported by Pune citizens, including location, public status and authority assignment."
};

export default async function TopTrafficProblemsPage() {
  const issues = await getPublicIssues();

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-100">
        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-700 border border-orange-100 uppercase tracking-widest mb-3">
            Public Directory
          </span>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">
            Top Citizen Reports
          </h1>
          <p className="text-slate-500 font-semibold mt-1">
            Browse active public issues verified by community moderators and track current resolution outcomes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {issues.map((issue) => (
          <article 
            className="group flex flex-col bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-900/5 hover:shadow-2xl hover:shadow-orange-950/5 hover:-translate-y-1 transition-all duration-300 p-6" 
            key={issue.id}
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                {issue.status.replaceAll("_", " ")}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-100 uppercase tracking-wider">
                {issue.severity ?? "moderate"} severity
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-950 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
              {issue.title}
            </h2>

            <p className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-4">
              <MapPin size={14} className="text-slate-400" /> {issue.locationName || issue.townVillage}, {issue.district || issue.state}
            </p>

            <p className="text-sm text-slate-600 mb-6 line-clamp-3 leading-relaxed">
              {issue.summary}
            </p>

            <div className="mt-auto">
              <div className="flex items-center gap-4 py-3 border-y border-slate-50 mb-4 text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1">
                  <ThumbsUp size={14} className="text-slate-400" /> {issue.supportCount} Supports
                </span>
                <span className="flex items-center gap-1">
                  <Share2 size={14} className="text-slate-400" /> {issue.shareCount} Shares
                </span>
              </div>

              <Link 
                href={`/traffic-issues/pune/${issue.slug}`} 
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-700 text-xs font-black rounded-xl transition-all border border-slate-100 hover:border-orange-200"
              >
                View full record <ArrowRight size={14} />
              </Link>
            </div>
          </article>
        ))}
      </div>

      {issues.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-900/5 max-w-xl mx-auto">
          <p className="text-lg font-bold text-slate-800">No public issues yet</p>
          <p className="text-sm font-semibold text-slate-500 mt-2">
            Citizen reports appear here once they have been reviewed and published.
          </p>
        </div>
      )}
    </main>
  );
}
