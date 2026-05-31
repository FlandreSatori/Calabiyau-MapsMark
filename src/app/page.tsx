import Link from "next/link";

import { MapForm, ReviewForm } from "@/components/forms";
import { HistoryList } from "@/components/history-list";
import { MapCard } from "@/components/map-card";
import { MetricDashboard } from "@/components/metric-dashboard";
import { formatDateTime } from "@/lib/format";
import { loadState } from "@/lib/github-store";
import { summarizeState } from "@/lib/state-utils";
import { defaultMapTypes, ratingLabelText } from "@/lib/types";

export default async function HomePage({ searchParams }: { searchParams?: { bg?: string } }) {
    const state = await loadState();
    const summary = summarizeState(state);
    const background = searchParams?.bg;

    return (
        <main className="app-shell" style={background ? { background } : undefined}>
            <div className="container grid gap-18">
                <div className="topbar">
                    <div className="brand">
                        <div className="brand-mark" />
                        <div>
                            <h1>MapsMark</h1>
                            <p>地图投稿、五星评价、排行榜和雷达图一体化平台</p>
                        </div>
                    </div>
                    <div className="toolbar">
                        <Link className="pill" href="#submit-map">投稿地图</Link>
                        <Link className="pill" href="#submit-review">提交评价</Link>
                        <Link className="pill" href="/admin">后台管理</Link>
                        <Link className="pill" href="/embed">嵌入页</Link>
                    </div>
                </div>

                <section className="grid grid-hero">
                    <div className="panel panel-pad">
                        <p className="section-title">Overview</p>
                        <h2 className="hero-title">让地图投稿、历史评价和雷达分析放在同一处展示。</h2>
                        <p className="hero-text">
                            任何人都可以投稿地图、给出五星评价并查看历史数据。管理员通过后台处理删改；
                            所有数据都写回 GitHub 仓库，便于 Vercel 部署与长期保存。
                        </p>
                        <div className="stat-strip" style={{ marginTop: 18 }}>
                            <span className="stat">地图总数 {summary.mapCount}</span>
                            <span className="stat">评价总数 {summary.reviewCount}</span>
                            <span className="stat">更新时间 {formatDateTime(state.updatedAt)}</span>
                        </div>
                        <div className="metrics">
                            {Object.entries(summary.averages).map(([key, value]) => (
                                <div className="metric" key={key}>
                                    <strong>{value.toFixed(1)}</strong>
                                    <span>{ratingLabelText[key as keyof typeof ratingLabelText]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="panel panel-pad panel-strong">
                        <p className="section-title">Radar</p>
                        <MetricDashboard values={summary.averages} />
                    </div>
                </section>

                <section className="panel panel-pad" id="submit-map">
                    <p className="section-title">Submit Map</p>
                    <MapForm mapTypes={[...defaultMapTypes]} />
                </section>

                <section className="panel panel-pad" id="submit-review">
                    <p className="section-title">Submit Review</p>
                    <ReviewForm maps={summary.maps} />
                </section>

                <section className="panel panel-pad">
                    <p className="section-title">Latest Maps</p>
                    <div className="cover-grid">
                        {summary.maps.map((map) => (
                            <MapCard key={map.id} map={map} reviews={summary.reviews} />
                        ))}
                    </div>
                </section>

                <section className="grid grid-hero">
                    <div className="panel panel-pad">
                        <p className="section-title">排行榜</p>
                        <div className="list">
                            {Object.entries(summary.bestByMetric).map(([metric, items]) => (
                                <div className="list-item" key={metric}>
                                    <div className="list-row">
                                        <strong>{ratingLabelText[metric as keyof typeof ratingLabelText]}</strong>
                                        <span className="badge">Top {items.length}</span>
                                    </div>
                                    <div className="list">
                                        {items.slice(0, 3).map(({ map, score, reviewCount }) => (
                                            <div key={map.id} className="list-row">
                                                <span>{map.name}</span>
                                                <span>{score.toFixed(1)} · {reviewCount} 条评价</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="panel panel-pad">
                        <p className="section-title">历史事件</p>
                        <HistoryList events={summary.events} />
                    </div>
                </section>
            </div>
        </main>
    );
}
