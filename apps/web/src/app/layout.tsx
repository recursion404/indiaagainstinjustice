import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "India Against Injustice (IAI) | Public Accountability & Civic Records",
    template: "%s | India Against Injustice"
  },
  description:
    "Report civic injustices, monitor public works projects, track politicians and authorities, access government schemes, and drive nation-wide civic action on India's premier public accountability platform.",
  openGraph: {
    title: "India Against Injustice (IAI) | Public Accountability",
    description:
      "Join India's premier platform for citizen reporting, civic awareness, and monitoring public development records.",
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "en_IN",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "India Against Injustice (IAI) | Public Accountability & Civic Records",
    description:
      "Empowering citizens to report issues, monitor public works, and access government schemes."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900 selection:bg-orange-100 antialiased">
        <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,103,31,0.08),rgba(255,255,255,0))] pb-20 md:pb-0">
          
          {/* Header */}
          <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
              <Link className="flex flex-col group" href="/">
                <strong className="text-lg font-black tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">
                  {siteConfig.name}
                </strong>
                <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                  {siteConfig.tagline}
                </span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
                <Link href="/live-traffic" className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors">Civic Issues</Link>
                <Link href="/report-traffic-problem" className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors">Report Issue</Link>
                <Link href="/top-traffic-problems" className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors">Public Records</Link>
                <Link href="/polls" className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors">Polls</Link>
                <Link href="/traffic-rules-pledge" className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors">Pledge</Link>
                <Link href="/volunteer" className="ml-2 px-4 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-full shadow-sm hover:shadow transition-all">Join Volunteer</Link>
              </nav>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 w-full">
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around h-16 border-t border-slate-100 bg-white/95 backdrop-blur-md px-2 pb-safe shadow-lg" aria-label="Mobile bottom navigation">
            <Link href="/" className="flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-orange-600 flex-1">
              <span className="text-lg">🏛️</span>
              <span className="text-[10px] font-bold">Home</span>
            </Link>
            <Link href="/live-traffic" className="flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-orange-600 flex-1">
              <span className="text-lg">📢</span>
              <span className="text-[10px] font-bold">Issues</span>
            </Link>
            <Link href="/report-traffic-problem" className="flex flex-col items-center justify-center gap-0.5 text-orange-600 hover:text-orange-700 flex-1 relative -top-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-200">
                <span className="text-xl">＋</span>
              </div>
            </Link>
            <Link href="/polls" className="flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-orange-600 flex-1">
              <span className="text-lg">📊</span>
              <span className="text-[10px] font-bold">Polls</span>
            </Link>
            <Link href="/volunteer" className="flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-orange-600 flex-1">
              <span className="text-lg">🤝</span>
              <span className="text-[10px] font-bold">Join</span>
            </Link>
          </nav>

          {/* Footer (Desktop only) */}
          <footer className="hidden md:block py-8 border-t border-slate-100 bg-slate-50/50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-xs font-semibold text-slate-400">
              © {new Date().getFullYear()} India Against Injustice (IAI). Citizen reports are public-interest submissions. Private citizen data is strictly confidential.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
