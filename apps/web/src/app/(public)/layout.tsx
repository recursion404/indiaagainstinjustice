import Link from "next/link";
import { siteConfig } from "@/lib/site";
import Navigation from "@/components/Navigation";
import { DownloadAppButton } from "@/components/pwa/DownloadAppButton";

const footerLinks = [
  { href: "/records", label: "Records archive" },
  { href: "/pledge", label: "Citizen pledge" },
  { href: "/volunteer", label: "Volunteer" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link className="group flex min-w-0 shrink-0 flex-col" href="/">
            <strong className="text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
              {siteConfig.name}
            </strong>
            <span className="hidden max-w-[240px] text-xs font-medium uppercase tracking-wide text-muted-foreground sm:block">
              Civic accountability platform
            </span>
          </Link>

          <Navigation />
        </div>
      </header>

      <main className="w-full flex-1">{children}</main>

      <footer className="hidden border-t border-border bg-muted/30 py-8 md:block">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-medium text-foreground">{siteConfig.name}</p>
              <p className="mt-1">Citizen reports are public-interest submissions. Private citizen data is strictly confidential.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {footerLinks.map((link) => (
                <Link className="rounded-md px-3 py-2 font-medium hover:bg-background hover:text-foreground" href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
              <DownloadAppButton />
            </div>
          </div>
          <p>© {new Date().getFullYear()} India Against Injustice (IAI).</p>
        </div>
      </footer>
    </div>
  );
}
