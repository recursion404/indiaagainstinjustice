import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top Traffic Problems in Pune | Citizen Reports & Support",
  description:
    "See the traffic problems most reported and supported by Pune citizens, including location, public status and authority assignment."
};

export default function TopTrafficProblemsPage() {
  return (
    <main className="container band">
      <div className="sectionHeader">
        <h1>Top Traffic Problems in Pune</h1>
        <span className="status">Citizen reports</span>
      </div>
      <div className="grid">
        {["Baner", "Wakad", "Kothrud"].map((area, index) => (
          <article className="card" key={area}>
            <span className="status">{index === 0 ? "Most supported" : "Published"}</span>
            <h2>{area} traffic concern</h2>
            <p>
              Public issue ranking will combine report freshness, support count, status
              and authority action without mixing in social share count.
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}
