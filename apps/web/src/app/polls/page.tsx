import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pune Traffic Polls | Citizens First Pune",
  description:
    "Vote on priorities for improving traffic in Pune and share polls with fellow citizens."
};

export default function PollsPage() {
  return (
    <main className="container band">
      <h1>Pune Traffic Polls</h1>
      <section className="card">
        <h2>What should Pune prioritize first?</h2>
        <p>Poll voting will connect to Supabase in the next implementation pass.</p>
      </section>
    </main>
  );
}
