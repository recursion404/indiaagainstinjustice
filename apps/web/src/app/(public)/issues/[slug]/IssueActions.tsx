"use client";

import { Copy, Facebook, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui";

type IssueActionsProps = {
  issueTitle: string;
  issueUrl: string;
};

export default function IssueActions({ issueTitle, issueUrl }: IssueActionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const shareMessage = `Public civic issue: ${issueTitle}\n\nView the issue details on India Against Injustice:\n${issueUrl}`;

  async function copyShareMessage() {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setMessage("Share message copied.");
    } catch {
      setMessage("Could not copy the message. Please copy the page link from your browser.");
    }
  }

  function openShareUrl(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const encodedMessage = encodeURIComponent(shareMessage);
  const encodedUrl = encodeURIComponent(issueUrl);
  const encodedTitle = encodeURIComponent(issueTitle);

  return (
    <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/10 p-5">
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={copyShareMessage}>
          <Copy size={16} /> Copy message
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => openShareUrl(`https://wa.me/?text=${encodedMessage}`)}
        >
          <MessageCircle size={16} /> WhatsApp
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => openShareUrl(`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`)}
        >
          X
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => openShareUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)}
        >
          <Facebook size={16} /> Facebook
        </Button>
      </div>
      {message ? <p className="text-sm font-semibold text-muted-foreground">{message}</p> : null}
    </div>
  );
}
