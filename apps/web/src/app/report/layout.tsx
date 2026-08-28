import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report a Civic Issue in India | India Against Injustice",
  description:
    "Submit simple or detailed civic issue reports across India. Reports remain private until reviewed for public accountability."
};

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
