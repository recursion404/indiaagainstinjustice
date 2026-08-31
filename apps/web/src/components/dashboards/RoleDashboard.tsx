"use client";

import Link from "next/link";
import { Building2, FileText, Handshake, MessageSquare, ShieldCheck, Vote } from "lucide-react";
import { Badge, ButtonLink, Card, PageShell } from "@/components/ui";
import type { AccountRole } from "@/lib/accountRoles";

type DashboardAction = {
  title: string;
  description: string;
  href: string;
  icon: "report" | "issues" | "polls" | "comments" | "ngo" | "volunteer";
};

const icons = {
  report: FileText,
  issues: ShieldCheck,
  polls: Vote,
  comments: MessageSquare,
  ngo: Building2,
  volunteer: Handshake,
};

const dashboardCopy: Record<Exclude<AccountRole, "admin" | "superadmin">, {
  eyebrow: string;
  title: string;
  description: string;
  actions: DashboardAction[];
}> = {
  citizen: {
    eyebrow: "Citizen dashboard",
    title: "Your civic participation hub",
    description: "Submit issues, follow public records, vote in polls, and comment where discussion is open.",
    actions: [
      { title: "Submit a report", description: "Create a public-interest civic issue with clear location details.", href: "/report", icon: "report" },
      { title: "Browse public issues", description: "Track reviewed issues that are visible to everyone.", href: "/issues", icon: "issues" },
      { title: "Join polls", description: "Vote on community priorities and local accountability questions.", href: "/polls", icon: "polls" },
    ],
  },
  volunteer: {
    eyebrow: "Volunteer dashboard",
    title: "Support local verification work",
    description: "Use this space for verification tasks, field notes, and community follow-up as volunteer tools expand.",
    actions: [
      { title: "Review public issues", description: "Find records that may need community support or follow-up.", href: "/issues", icon: "issues" },
      { title: "Submit field report", description: "Send a new issue or updated local observation.", href: "/report", icon: "report" },
      { title: "Coordinate as volunteer", description: "Return to the volunteer program page and contribution flow.", href: "/volunteer", icon: "volunteer" },
    ],
  },
  ngo: {
    eyebrow: "NGO dashboard",
    title: "Organization action workspace",
    description: "Monitor civic issues, public records, and community priorities relevant to your organization.",
    actions: [
      { title: "Public issue registry", description: "Scan active public records and identify issues to support.", href: "/issues", icon: "issues" },
      { title: "Records archive", description: "Open published civic records for reference and documentation.", href: "/records", icon: "ngo" },
      { title: "Public polls", description: "Follow community sentiment around local problems.", href: "/polls", icon: "polls" },
    ],
  },
};

export function RoleDashboard({ role, name }: { role: Exclude<AccountRole, "admin" | "superadmin">; name?: string | null }) {
  const copy = dashboardCopy[role];

  return (
    <PageShell className="py-8">
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <Badge>{copy.eyebrow}</Badge>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
            {name ? `Welcome, ${name}` : copy.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy.description}</p>
          <div className="mt-6 border-t border-border pt-5">
            <ButtonLink className="w-full" href="/issues" variant="secondary">
              View public issues
            </ButtonLink>
          </div>
        </aside>

        <section className="space-y-6">
          <Card className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <Badge tone="muted">Separate workspace</Badge>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{copy.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                This dashboard is its own route so future {role} features can grow without being mixed into admin moderation.
              </p>
            </div>
            <ButtonLink href="/report">Submit report</ButtonLink>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {copy.actions.map((action) => {
              const Icon = icons[action.icon];
              return (
                <Link
                  className="rounded-lg border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                  href={action.href}
                  key={action.title}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon size={18} />
                  </span>
                  <h3 className="mt-5 text-base font-semibold text-foreground">{action.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.description}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
