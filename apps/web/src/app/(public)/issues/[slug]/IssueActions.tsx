"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type IssueActionsProps = {
  issueTitle: string;
  issueUrl: string;
};

export default function IssueActions({ issueTitle, issueUrl }: IssueActionsProps) {
  const [message, setMessage] = useState<string | null>(null);

  async function shareIssue() {
    const text = `${issueTitle} - Support this public civic issue on India Against Injustice.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: issueTitle,
          text,
          url: issueUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${text} ${issueUrl}`);
        setMessage("Issue link copied.");
      }
    } catch {
      setMessage("Sharing was cancelled.");
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/10 p-5">
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={shareIssue}>
          Share issue
        </Button>
        <Button type="button" variant="secondary" onClick={() => setMessage("Support voting is available in the app after sign in.")}>
          Support
        </Button>
      </div>
      {message ? <p className="text-sm font-semibold text-muted-foreground">{message}</p> : null}
    </div>
  );
}
