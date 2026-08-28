import { Badge, ButtonLink, Card, PageShell, SectionHeader } from "@/components/ui";

const pledgePoints = [
  "I will report public issues truthfully, with clear evidence where possible.",
  "I will not share private citizen details, unsafe rumours or personal attacks.",
  "I will support verified issues that affect my area, ward, village, town, district, state or country.",
  "I will respect public property, follow civic rules and encourage lawful participation.",
  "I will help convert complaints into public records, responsible follow-up and visible action.",
];

export default function PledgePage() {
  return (
    <PageShell>
      <SectionHeader
        eyebrow="Citizen Pledge"
        title="Responsible action starts with us."
        description="India Against Injustice is built around public accountability, but the platform only works when citizen participation stays truthful, lawful and respectful."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-5">
          <Badge tone="orange">Public responsibility</Badge>
          <div className="space-y-4">
            {pledgePoints.map((point, index) => (
              <div
                className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-4"
                key={point}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-black text-orange-700">
                  {index + 1}
                </span>
                <p className="text-base font-semibold leading-7 text-slate-700">{point}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-8 bg-slate-950 text-white">
          <div className="space-y-4">
            <Badge tone="green">Movement</Badge>
            <h2 className="text-4xl font-black tracking-tight">
              Public records need public discipline.
            </h2>
            <p className="text-lg leading-8 text-slate-300">
              Every issue, comment, vote and support action should help people understand what
              happened, what is pending and who can act next.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/report">Report an issue</ButtonLink>
            <ButtonLink href="/issues" variant="secondary">
              See public issues
            </ButtonLink>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
