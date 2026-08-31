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

const workflowSteps = [
  {
    title: "Submit report",
    description: "A citizen shares a new issue privately for admin review.",
  },
  {
    title: "Public issue",
    description: "Approved reports become browseable issue pages people can support and discuss.",
  },
  {
    title: "Records archive",
    description: "Published issue pages are kept as long-term civic records for tracking and reference.",
  },
];

export default async function HomePage() {
  const issues = await getPublicIssues(6);
  const supportTotal = issues.reduce((sum, issue) => sum + (issue.supportCount ?? 0), 0);

  return (
    <PageShell className="space-y-14">
      <section className="grid gap-10 border-b border-border pb-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
        <div className="space-y-7">
          <Badge tone="orange">India-wide public accountability</Badge>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-5xl font-semibold leading-none tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              India Against Injustice
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Report civic issues, build public records, support verified problems and help
              communities turn scattered complaints into visible public action.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/report">Submit report</ButtonLink>
            <ButtonLink href="/issues" variant="secondary">
              See public issues
            </ButtonLink>
          </div>
        </div>

        <Card className="p-0">
          <div className="border-b border-border p-6">
            <Badge tone="green">Public record</Badge>
            <div className="mt-6 space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Citizen reports become searchable issue pages.
              </h2>
              <p className="leading-7 text-muted-foreground">
                Public-safe pages make each issue easier to support, share, review and track.
              </p>
            </div>
          </div>
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                className="bg-muted/40 shadow-none"
                label="public issues"
                value={issues.length}
              />
              <StatCard
                className="bg-muted/40 shadow-none"
                label="citizen supports"
                value={supportTotal}
              />
            </div>
            <div className="rounded-md border border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
              Public issue pages are browseable without login. Comments and support actions can require a citizen account where needed.
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {workflowSteps.map((step, index) => (
          <Card className="space-y-3" key={step.title}>
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted text-sm font-medium text-muted-foreground">
              {index + 1}
            </span>
            <h2 className="text-lg font-semibold text-foreground">{step.title}</h2>
            <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
          </Card>
        ))}
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
              <h3 className="text-xl font-semibold text-foreground">{area}</h3>
              <p className="leading-7 text-muted-foreground">
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
              <Card className="h-full transition-colors hover:border-primary/30">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="orange">{issue.category}</Badge>
                    <Badge tone="green">{issue.status.replaceAll("_", " ")}</Badge>
                  </div>
                  <h3 className="text-xl font-semibold leading-tight text-foreground">
                    {issue.title}
                  </h3>
                  <p className="line-clamp-3 leading-7 text-muted-foreground">{issue.summary}</p>
                  <p className="text-sm font-medium uppercase tracking-wide text-primary">
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
