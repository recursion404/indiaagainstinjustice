import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck, Siren } from "lucide-react";
import { getPublicIssues } from "@/lib/data";

export default async function HomePage() {
  const issues = await getPublicIssues(3);
  const supportTotal = issues.reduce((sum, issue) => sum + issue.supportCount, 0);

  return (
    <main>
      <section className="container hero">
        <div>
          <p className="status">Pune Against Traffic Jams</p>
          <h1>Pune Traffic Problems & Traffic Jams</h1>
          <p>
            Report congestion, incomplete roads, signal problems, illegal parking and
            public transport traffic issues. Help turn scattered complaints into
            visible, trackable citizen action.
          </p>
          <div className="actions">
            <Link className="button" href="/report-traffic-problem">
              Report a problem <ArrowRight size={18} />
            </Link>
            <Link className="button secondary" href="/live-traffic">
              View live traffic
            </Link>
          </div>
        </div>
        <aside className="heroPanel" aria-label="Campaign snapshot">
          <div>
            <Siren size={34} />
            <h2>Citizen reports become public issue pages.</h2>
            <p>
              Search-friendly, privacy-safe pages make each public problem easier to
              support, share, assign and verify.
            </p>
          </div>
          <div className="roadLines" />
          <div className="stats">
            <div className="stat">
              <strong>{issues.length}</strong>
              <span>public issues</span>
            </div>
            <div className="stat">
              <strong>{supportTotal}</strong>
              <span>citizen supports</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="band">
        <div className="container">
          <div className="sectionHeader">
            <h2>Top Traffic Problems</h2>
            <Link className="button secondary" href="/top-traffic-problems">
              View all
            </Link>
          </div>
          <div className="grid">
            {issues.map((issue) => (
              <article className="card" key={issue.id}>
                <span className="status">{issue.status.replaceAll("_", " ")}</span>
                <h3>{issue.title}</h3>
                <p className="issueMeta">
                  <MapPin size={16} /> {issue.area}, {issue.city}
                </p>
                <p>{issue.supportCount} citizens support this issue.</p>
                <Link href={`/traffic-issues/pune/${issue.slug}`}>
                  View public issue
                </Link>
              </article>
            ))}
            {issues.length === 0 ? (
              <article className="card">
                <h3>No public issues yet</h3>
                <p>Citizen reports appear here after review and publication.</p>
              </article>
            ) : null}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="container grid">
          <article className="card">
            <ShieldCheck size={28} />
            <h3>Privacy-first public pages</h3>
            <p>
              Public SEO pages exclude mobile numbers, private addresses, internal
              notes and sensitive personal information.
            </p>
          </article>
          <article className="card">
            <MapPin size={28} />
            <h3>Local Pune focus</h3>
            <p>
              Baner, Balewadi, Wakad, Hinjewadi, Aundh, Kothrud and Viman Nagar pages
              will be published only when useful local content exists.
            </p>
          </article>
          <article className="card">
            <ArrowRight size={28} />
            <h3>Support is not sharing</h3>
            <p>
              Citizen support and social sharing are tracked separately so issue
              ranking remains meaningful.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
