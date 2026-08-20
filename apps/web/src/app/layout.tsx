import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Pune Traffic Problems & Traffic Jams | Citizens First Pune",
    template: "%s | Citizens First Pune"
  },
  description:
    "Report traffic jams, congestion, incomplete roads, signal problems and public transport traffic issues in Pune. Support citizen-reported problems and join Pune Against Traffic Jams.",
  openGraph: {
    title: "Pune Traffic Problems & Traffic Jams | Citizens First Pune",
    description:
      "Report traffic jams, road problems, signal issues and public transport traffic concerns in Pune.",
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "en_IN",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Pune Traffic Problems & Traffic Jams | Citizens First Pune",
    description:
      "Support citizen-reported traffic problems and join Pune Against Traffic Jams."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        <div className="shell">
          <header className="container topbar">
            <Link className="brand" href="/">
              <strong>{siteConfig.name}</strong>
              <span>{siteConfig.tagline}</span>
            </Link>
            <nav className="nav" aria-label="Primary navigation">
              <Link href="/live-traffic">Live Traffic</Link>
              <Link href="/report-traffic-problem">Report</Link>
              <Link href="/top-traffic-problems">Top Problems</Link>
              <Link href="/polls">Polls</Link>
              <Link href="/traffic-rules-pledge">Pledge</Link>
              <Link href="/volunteer">Volunteer</Link>
            </nav>
          </header>
          {children}
          <footer className="container footer">
            Citizen reports are public-interest submissions. Private citizen data stays private.
          </footer>
        </div>
      </body>
    </html>
  );
}
