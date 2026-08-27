import type { Metadata } from "next";
import { notFound } from "next/navigation";

const locationNames: Record<string, string> = {
  baner: "Baner",
  balewadi: "Balewadi",
  wakad: "Wakad",
  hinjewadi: "Hinjewadi",
  aundh: "Aundh",
  kothrud: "Kothrud",
  "viman-nagar": "Viman Nagar"
};

const puneLocations = Object.keys(locationNames);

type PageProps = {
  params: { location: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { location } = params;
  const name = locationNames[location];

  if (!name) {
    return {};
  }

  return {
    title: `${name} Traffic | Pune Traffic Problems`,
    description: `Citizen-reported traffic problems, congestion updates and public action records for ${name}, Pune.`,
    robots: {
      index: false,
      follow: true
    }
  };
}

export function generateStaticParams() {
  return puneLocations.map((location) => ({ location }));
}

export default async function LocationTrafficPage({ params }: PageProps) {
  const { location } = params;
  const name = locationNames[location];

  if (!name) {
    notFound();
  }

  return (
    <main className="container band">
      <span className="status">Noindex until useful local content exists</span>
      <h1>{name} Traffic</h1>
      <section className="card">
        <p>
          This location page is prepared for genuine local reporting, recurring
          congestion notes, public transport observations and authority action updates.
          It should remain noindex until the page has useful citizen-facing content.
        </p>
      </section>
    </main>
  );
}
