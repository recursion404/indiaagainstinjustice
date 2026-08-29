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
          "inline-flex items-center justify-center gap-2 rounded-full border font-black transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800",
          compact
            ? "w-full px-2 py-2 text-[10px] uppercase tracking-[0.08em] text-slate-600 sm:text-xs"
            : "border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm shadow-slate-200/60"
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
            "absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-orange-100 bg-white px-4 py-3 text-xs font-extrabold leading-relaxed text-slate-700 shadow-xl shadow-slate-900/10",
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
