import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report Traffic Problems in Pune | Pune Against Traffic Jams",
  description:
    "Report traffic jams, road problems, signal issues, illegal parking and other traffic concerns in Pune. Add your location and photographs and help citizens identify the problems that affect them."
};

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
