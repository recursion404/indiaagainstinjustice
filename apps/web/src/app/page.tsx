import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck, Siren } from "lucide-react";
import { getPublicIssues } from "@/lib/data";

export default async function HomePage() {
  const issues = await getPublicIssues(3);
  const supportTotal = issues.reduce((sum, issue) => sum + issue.supportCount, 0);

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center mb-20">
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100 uppercase tracking-wider">
              🇮🇳 India Against Injustice (IAI)
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
              Public Accountability <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-green-600">
                & Civic Records
              </span>
            </h1>
            <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
              Report civic injustices, monitor public works projects, track politicians and authorities,
              and drive nation-wide citizen action on India's premier public accountability platform.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-orange-100 hover:shadow-xl hover:-translate-y-0.5 transition-all" href="/report-traffic-problem">
                Report an Issue <ArrowRight size={18} />
              </Link>
              <Link className="inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl hover:-translate-y-0.5 transition-all" href="/live-traffic">
                View Civic Issues
              </Link>
            </div>
          </div>
          
          <div className="lg:col-span-5">
            <aside className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl shadow-slate-900/10 border border-slate-800" aria-label="Campaign snapshot">
              {/* Decorative Background Glow */}
              <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/0 blur-2xl pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-gradient-to-br from-green-500/10 to-emerald-500/0 blur-2xl pointer-events-none" />
              
              <div className="relative space-y-6">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <Siren size={24} />
                </div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  Citizen reports become searchable, public accountability records.
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Search-friendly, privacy-safe public pages make each civic problem easier to
                  support, share, assign, and verify.
                </p>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
                  <div className="space-y-1">
                    <strong className="block text-3xl font-black text-white">{issues.length}</strong>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">public issues</span>
                  </div>
                  <div className="space-y-1">
                    <strong className="block text-3xl font-black text-white">{supportTotal}</strong>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">citizen supports</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Recent Public Reports */}
        <section className="mb-20">
          <div className="flex items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Recent Public Reports</h2>
            <Link className="text-sm font-bold text-orange-600 hover:text-orange-700 hover:underline" href="/top-traffic-problems">
              View all
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {issues.map((issue) => (
              <article className="flex flex-col h-full bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all p-6 group" key={issue.id}>
                <div className="mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                    {issue.status.replaceAll("_", " ")}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
                  {issue.title}
                </h3>
                <p className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-4">
                  <MapPin size={14} className="text-slate-400" /> {issue.area}, {issue.city}
                </p>
                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-600">{issue.supportCount} supports</span>
                  <Link href={`/traffic-issues/pune/${issue.slug}`} className="text-xs font-bold text-orange-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    View record <ArrowRight size={12} />
                  </Link>
                </div>
              </article>
            ))}
            
            {issues.length === 0 && (
              <div className="col-span-full bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-500">
                <h3 className="text-lg font-bold text-slate-800 mb-1">No public records yet</h3>
                <p className="text-sm text-slate-500">Citizen reports appear here after review and publication.</p>
              </div>
            )}
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <article className="bg-white rounded-3xl border border-slate-100 p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-slate-950">Privacy-first public pages</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Public SEO pages exclude mobile numbers, private addresses, internal
              notes, and sensitive personal information.
            </p>
          </article>
          
          <article className="bg-white rounded-3xl border border-slate-100 p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <MapPin size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-slate-950">Nation-wide coverage</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Citizen reports and public records are categorized by state, district,
              and village/ward for highly localized civic tracking.
            </p>
          </article>
          
          <article className="bg-white rounded-3xl border border-slate-100 p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <ArrowRight size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-slate-950">Support & Verification</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Upvoting, sharing, and commenting on public works projects help ensure
              quality and prevent duplicate/wasteful spending.
            </p>
          </article>
        </section>

      </div>
    </div>
  );
}
