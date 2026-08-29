import Link from "next/link";
import { siteConfig } from "@/lib/site";
import Navigation from "@/components/Navigation";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,103,31,0.08),rgba(255,255,255,0))] pb-20 md:pb-0">
      <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link className="group flex shrink-0 flex-col" href="/">
            <strong className="text-lg font-black tracking-tight text-slate-900 transition-colors group-hover:text-orange-600">
              {siteConfig.name}
            </strong>
            <span className="max-w-[240px] text-xs font-medium uppercase tracking-wide text-slate-500 sm:max-w-none">
              {siteConfig.tagline}
            </span>
          </Link>

          <Navigation />
        </div>
      </header>

      <main className="w-full flex-1">{children}</main>

      <footer className="hidden border-t border-slate-100 bg-slate-50/50 py-8 md:block">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs font-semibold text-slate-400 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} India Against Injustice (IAI). Citizen reports are public-interest submissions. Private citizen data is strictly confidential.
        </div>
      </footer>
    </div>
  );
}
