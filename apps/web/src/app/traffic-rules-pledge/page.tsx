import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pune Traffic Rules Pledge | I Will Follow All Traffic Rules",
  description:
    "Take the Citizens First Pune traffic-rules pledge and encourage more Pune citizens to follow safe and responsible traffic practices."
};

export default function TrafficRulesPledgePage() {
  return (
    <main className="container band">
      <h1>Pune Traffic Rules Pledge</h1>
      <section className="card">
        <p>
          I will follow traffic rules, respect signals, avoid wrong-side driving and
          support safer, more responsible travel in Pune.
        </p>
        <button className="button" type="button">
          Take pledge
        </button>
      </section>
    </main>
  );
}
