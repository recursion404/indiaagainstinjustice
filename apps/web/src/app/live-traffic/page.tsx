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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10 pb-8 border-b border-slate-100">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100 uppercase tracking-wider">
            🚦 Live Traffic Reports
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
            Current Pune Civic Issues
          </h1>
        </div>
        <Link className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-orange-100 hover:shadow-xl hover:-translate-y-0.5 transition-all self-start sm:self-center" href="/report-traffic-problem">
          Report an Issue
        </Link>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Live Issues</span>
          <strong className="text-4xl font-black text-slate-900">{liveReports}</strong>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Verified Reports</span>
          <strong className="text-4xl font-black text-slate-900">{verifiedReports}</strong>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Severe Problems</span>
          <strong className="text-4xl font-black text-red-600">{severeReports}</strong>
        </div>
      </div>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {issues.map((issue) => {
          const isSevere = issue.trafficCondition === "severe";
          return (
            <article className="flex flex-col bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all p-6 group" key={issue.id}>
              
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                  isSevere 
                    ? "bg-red-50 text-red-700 border-red-100" 
                    : "bg-blue-50 text-blue-700 border-blue-100"
                }`}>
                  {issue.trafficCondition ?? "heavy"} traffic
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {issue.status.replaceAll("_", " ")}
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-950 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
                {issue.title}
              </h2>

              <p className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-3">
                <MapPin size={14} className="text-slate-400" /> {issue.locationName || issue.area}, {issue.city}
              </p>

              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">
                {categoryLabel(issue.category)} · {issue.severity ?? "moderate"} severity
              </p>

              <p className="text-sm text-slate-600 mb-6 line-clamp-3">
                {issue.summary}
              </p>

              {/* Card Footer Metric Grid */}
              <div className="mt-auto pt-4 border-t border-slate-50 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="flex flex-col items-center p-2 bg-slate-50/50 rounded-lg">
                    <CheckCircle2 size={14} className="text-green-600 mb-1" />
                    <strong className="text-xs text-slate-800">{issue.confirmationCount ?? 0}</strong>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">confirmed</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-slate-50/50 rounded-lg">
                    <AlertTriangle size={14} className="text-amber-600 mb-1" />
                    <strong className="text-xs text-slate-800">{issue.notObservedCount ?? 0}</strong>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">not seen</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-slate-50/50 rounded-lg">
                    <Clock size={14} className="text-blue-500 mb-1" />
                    <strong className="text-xs text-slate-800">
                      {new Date(issue.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </strong>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">reported</span>
                  </div>
                </div>

                <Link href={`/traffic-issues/pune/${issue.slug}`} className="inline-flex items-center justify-center w-full py-2.5 bg-slate-50 group-hover:bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl transition-all">
                  Open Public Record
                </Link>
              </div>

            </article>
          );
        })}
        
        {issues.length === 0 && (
          <div className="col-span-full bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-500">
            <h2 className="text-xl font-bold text-slate-800 mb-2">No live public reports yet</h2>
            <p className="text-sm text-slate-500">Reviewed citizen reports will appear here after moderation.</p>
          </div>
        )}
      </div>

    </div>
  );
}
