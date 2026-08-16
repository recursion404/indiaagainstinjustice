import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pune Traffic Polls | Citizens First Pune",
  description: "Vote on priorities for improving traffic in Pune and share polls with fellow citizens."
};

export default function PollsLayout({ children }: { children: React.ReactNode }) { return children; }
