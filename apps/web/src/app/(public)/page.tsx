import Link from "next/link";
import { Badge, ButtonLink, Card, PageShell, SectionHeader, StatCard } from "@/components/ui";
import { getPublicIssues } from "@/lib/data";

const focusAreas = [
  "Roads and infrastructure",
  "Education",
  "Health",
  "Public services",
  "Budgets and projects",
  "Local governance",
];

export default async function HomePage() {
  const issues = await getPublicIssues(6);
  const supportTotal = issues.reduce((sum, issue) => sum + (issue.supportCount ?? 0), 0);

  return (
    <PageShell className="space-y-16">
      <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <Badge tone="orange">India-wide public accountability</Badge>
          <div className="space-y-5">
            <h1 className="font-serif text-6xl font-black leading-[0.92] tracking-tight text-slate-950 sm:text-7xl lg:text-8xl">
              India Against Injustice
            </h1>
            <p className="max-w-2xl text-xl font-semibold leading-9 text-slate-600">
              Report civic issues, build public records, support verified problems and help
              communities turn scattered complaints into visible public action.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/report">Report an issue</ButtonLink>
            <ButtonLink href="/issues" variant="secondary">
              See public issues
            </ButtonLink>
          </div>
        </div>

        <Card className="overflow-hidden bg-slate-950 p-0 text-white shadow-2xl shadow-orange-200">
          <div className="space-y-8 p-8 sm:p-10">
            <Badge tone="green">Public record</Badge>
            <div className="space-y-4">
              <h2 className="font-serif text-4xl font-black leading-tight">
                Citizen reports become searchable issue pages.
              </h2>
              <p className="text-lg leading-8 text-slate-300">
                Public-safe pages make each issue easier to support, share, review and track.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                className="border-white/10 bg-white/10 text-white"
                label="public issues"
                value={issues.length}
              />
              <StatCard
                className="border-white/10 bg-white/10 text-white"
                label="citizen supports"
                value={supportTotal}
              />
            </div>
          </div>
        </Card>
      </section>

      <section className="space-y-6">
        <SectionHeader
          eyebrow="Scope"
          title="Built for every public-interest issue."
          description="The platform is no longer limited to Pune traffic. The first foundation supports India-wide reporting while keeping the launch focused and manageable."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {focusAreas.map((area) => (
            <Card className="space-y-3" key={area}>
              <Badge tone="slate">Focus area</Badge>
              <h3 className="text-2xl font-black text-slate-950">{area}</h3>
              <p className="leading-7 text-slate-600">
                Create public records, gather support and help volunteers or admins move the issue
                toward accountable follow-up.
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeader
            eyebrow="Latest public records"
            title="Recently reviewed issues"
            description="Reports appear here only after admin review removes private information and marks them public."
          />
          <ButtonLink href="/records" variant="secondary">
            View all records
          </ButtonLink>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {issues.slice(0, 3).map((issue) => (
            <Link href={`/issues/${issue.slug}`} key={issue.id}>
              <Card className="h-full transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="orange">{issue.category}</Badge>
                    <Badge tone="green">{issue.status.replaceAll("_", " ")}</Badge>
                  </div>
                  <h3 className="text-2xl font-black leading-tight text-slate-950">
                    {issue.title}
                  </h3>
                  <p className="line-clamp-3 leading-7 text-slate-600">{issue.summary}</p>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-700">
                    {issue.publicId}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
