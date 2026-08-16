import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Volunteer for Pune Against Traffic Jams | Citizens First Pune",
  description:
    "Join a citizen movement working for better traffic management, stronger public transport, complete roads and accountable action in Pune."
};

export default function VolunteerPage() {
  return (
    <main className="container band">
      <h1>Volunteer for Pune Against Traffic Jams</h1>
      <p className="muted">
        Help review reports, verify public outcomes, document recurring traffic points
        and turn citizen observations into accountable action.
      </p>
    </main>
  );
}
