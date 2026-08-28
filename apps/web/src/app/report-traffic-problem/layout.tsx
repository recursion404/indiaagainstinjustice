import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report a Civic Issue | India Against Injustice",
  description: "This legacy traffic reporting URL now redirects to the India Against Injustice report flow."
};

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
