import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report Traffic Problems in Pune | Pune Against Traffic Jams",
  description:
    "Report traffic jams, road problems, signal issues, illegal parking and other traffic concerns in Pune. Add your location and photographs and help citizens identify the problems that affect them."
};

export default function ReportTrafficProblemPage() {
  return (
    <main className="container band">
      <div className="sectionHeader">
        <h1>Report Traffic Problems in Pune</h1>
        <span className="status">MVP form shell</span>
      </div>
      <form className="card form">
        <label className="field">
          Problem title
          <input placeholder="Example: Heavy traffic near Baner main road" />
        </label>
        <label className="field">
          Category
          <select defaultValue="traffic_jam">
            <option value="traffic_jam">Traffic jam</option>
            <option value="road_damage">Road problem</option>
            <option value="signal_issue">Signal issue</option>
            <option value="illegal_parking">Illegal parking</option>
            <option value="public_transport">Public transport issue</option>
          </select>
        </label>
        <label className="field">
          Area
          <input placeholder="Baner, Wakad, Hinjewadi..." />
        </label>
        <label className="field">
          Public summary
          <textarea rows={5} placeholder="Describe what citizens should know publicly." />
        </label>
        <button className="button" type="button">
          Submit report
        </button>
      </form>
    </main>
  );
}
