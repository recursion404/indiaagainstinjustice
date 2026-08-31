"use client";

import { Download, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/components/ui";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type DownloadAppButtonProps = {
  compact?: boolean;
  className?: string;
};

function isStandaloneMode() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

export function DownloadAppButton({ compact = false, className }: DownloadAppButtonProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    setInstalled(isStandaloneMode());

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setHint("");
    }

    function handleInstalled() {
      setInstalled(true);
      setInstallPrompt(null);
      setHint("App installed.");
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function downloadApp() {
    if (installed) {
      setHint("The app is already installed on this device.");
      return;
    }

    if (!installPrompt) {
      setHint("Use your browser menu and choose Add to Home Screen.");
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    setHint(choice.outcome === "accepted" ? "Installing app..." : "Install cancelled.");
  }

  return (
    <div className={cn("relative shrink-0", className)}>
      <button
        className={cn(
          "inline-flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary",
          compact
            ? "w-full px-2 text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs"
            : "border-input bg-background px-4 text-foreground shadow-sm"
        )}
        onClick={downloadApp}
        type="button"
      >
        {installed ? <CheckCircle2 size={compact ? 13 : 16} /> : <Download size={compact ? 13 : 16} />}
        <span>{installed ? "Installed" : "Download App"}</span>
      </button>
      {hint ? (
        <div
          className={cn(
            "absolute right-0 top-full z-50 mt-2 w-64 rounded-md border border-border bg-popover px-4 py-3 text-xs font-medium leading-relaxed text-popover-foreground shadow-md",
            compact && "left-0 right-auto w-56"
          )}
          role="status"
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
}
