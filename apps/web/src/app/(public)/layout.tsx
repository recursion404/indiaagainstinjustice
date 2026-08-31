import Link from "next/link";
import { siteConfig } from "@/lib/site";
import Navigation from "@/components/Navigation";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link className="group flex shrink-0 flex-col" href="/">
            <strong className="text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
              {siteConfig.name}
            </strong>
            <span className="max-w-[240px] text-xs font-medium uppercase tracking-wide text-muted-foreground sm:max-w-none">
              {siteConfig.tagline}
            </span>
          </Link>

          <Navigation />
        </div>
      </header>

      <main className="w-full flex-1">{children}</main>

      <footer className="hidden border-t border-border bg-muted/30 py-8 md:block">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
          © {new Date().getFullYear()} India Against Injustice (IAI). Citizen reports are public-interest submissions. Private citizen data is strictly confidential.
        </div>
      </footer>
    </div>
  );
}
