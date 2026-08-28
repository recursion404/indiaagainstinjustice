import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Citizen Responsibility Pledge | India Against Injustice",
  description:
    "Take a public civic responsibility pledge to report issues truthfully, support verified action and protect public resources.",
};

export default function PledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
