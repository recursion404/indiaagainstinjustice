import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { siteConfig } from "@/lib/site";
import Navigation from "@/components/Navigation";

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
              
              <Navigation />
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 w-full">
            {children}
          </main>

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
