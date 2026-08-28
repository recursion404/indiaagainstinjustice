import { ButtonLink, EmptyState, PageShell } from "@/components/ui";

export default function NotFound() {
  return (
    <PageShell>
      <EmptyState
        title="This public record was not found"
        description="The page may have moved, or the report may not have been reviewed for public visibility yet."
        action={<ButtonLink href="/issues">Browse public issues</ButtonLink>}
      />
    </PageShell>
  );
}
