import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteConfig } from "@/lib/site";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: "India Against Injustice (IAI) | Public Accountability & Civic Records",
    template: "%s | India Against Injustice"
  },
  description:
    "Report civic injustices, monitor public works projects, track politicians and authorities, access government schemes, and drive nation-wide civic action on India's premier public accountability platform.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "IAI"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ff6b00" },
    { media: "(prefers-color-scheme: dark)", color: "#ff8a00" }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900 selection:bg-orange-100 antialiased">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
