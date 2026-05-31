import { MapCard } from "@/components/map-card";
import { MetricDashboard } from "@/components/metric-dashboard";
import { loadState } from "@/lib/github-store";
import { summarizeState } from "@/lib/state-utils";
import { defaultMapTypes } from "@/lib/types";

export default async function EmbedPage({ searchParams }: { searchParams?: { bg?: string } }) {
    const state = await loadState();
    const summary = summarizeState(state);
    const background = searchParams?.bg;

    return (
        <main className="app-shell" style={{ padding: 16, ...(background ? { background } : {}) }}>
            <div className="container grid gap-18">
                <section className="panel panel-pad panel-strong">
                    <p className="section-title">Embed View</p>
                    <h2 className="hero-title" style={{ fontSize: "2.2rem" }}>嵌入展示</h2>
                </section>

                <section className="grid grid-hero">
                    <div className="panel panel-pad">
                        <MetricDashboard maps={summary.maps} reviews={summary.reviews} />
                    </div>
                </section>
            </div>
        </main>
    );
}
