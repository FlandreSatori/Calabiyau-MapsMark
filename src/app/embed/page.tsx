import { MapCard } from "@/components/map-card";
import { MetricDashboard } from "@/components/metric-dashboard";
import { loadState } from "@/lib/github-store";
import { summarizeState } from "@/lib/state-utils";
import { defaultMapTypes } from "@/lib/types";

export default async function EmbedPage({ searchParams }: { searchParams?: Promise<{ bg?: string }> }) {
    const state = await loadState();
    const summary = summarizeState(state);
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const background = resolvedSearchParams?.bg ?? state.ui?.background;

    return (
        <main className="app-shell embed-shell" style={background ? { background } : undefined}>
            <div className="container embed-full embed-layout">
                <section className="embed-header">
                    <div>
                        <p className="section-title">MapsMark Showcase</p>
                        <h1>地图作品集</h1>
                        <p>适合投屏、OBS 浏览器源与站外嵌入的实时概览。</p>
                    </div>
                    <div className="embed-stats" aria-label="数据摘要">
                        <div><strong>{summary.mapCount}</strong><span>地图</span></div>
                        <div><strong>{summary.reviewCount}</strong><span>评价</span></div>
                        <div><strong>{Object.keys(summary.typeCounts).length}</strong><span>类型</span></div>
                    </div>
                </section>

                <section className="embed-map-strip" aria-label="地图列表">
                    {summary.maps.slice(0, 8).map((map) => <MapCard key={map.id} map={map} reviews={summary.reviews} />)}
                </section>

                <section className="embed-metrics">
                    <MetricDashboard maps={summary.maps} reviews={summary.reviews} />
                </section>
            </div>
        </main>
    );
}
