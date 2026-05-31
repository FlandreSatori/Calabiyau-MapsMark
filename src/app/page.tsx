import Link from "next/link";

import { MapForm, ReviewForm } from "@/components/forms";
import { HistoryList } from "@/components/history-list";
import { MapCard } from "@/components/map-card";
// 使用表单内部的全局通知（避免从服务器组件传函数到客户端）
import { formatDateTime } from "@/lib/format";
import { buildTime } from "@/lib/build-meta";
import { loadState } from "@/lib/github-store";
import { summarizeState } from "@/lib/state-utils";
import { defaultMapTypes, ratingLabelText } from "@/lib/types";

export default async function HomePage({ searchParams }: { searchParams?: { bg?: string } }) {
    const state = await loadState();
    const summary = summarizeState(state);
    const background = searchParams?.bg ?? state.ui?.background;

    return (
        <main className="app-shell" style={background ? { background } : undefined}>
            <div className="container grid gap-18">
                <div className="topbar">
                    <div className="brand">
                        <div className="brand-mark" />
                        <div>
                            <h1>卡丘工坊地图评价</h1>
                            <p>你是怎么发现这里的喵</p>
                        </div>
                    </div>
                    <div className="toolbar">
                        <Link className="pill" href="#submit-map">上传地图</Link>
                        <Link className="pill" href="#submit-review">提交评价</Link>
                        <Link className="pill" href="/admin">后台管理</Link>
                        <Link className="pill" href="/embed">展示页</Link>
                    </div>
                </div>

                <section className="grid grid-hero">
                    <div className="panel panel-pad">
                        <p className="section-title">是啊玩什么</p>
                        <p className="hero-text">
                            请做出评价吧！
                        </p>
                        <div className="stat-strip" style={{ marginTop: 18 }}>
                            <span className="stat">地图总数 {summary.mapCount}</span>
                            <span className="stat">评价总数 {summary.reviewCount}</span>
                            <span className="stat">更新时间 {formatDateTime(state.updatedAt)}</span>
                        </div>
                        <div className="type-count-grid" style={{ marginTop: 20 }}>
                            {Object.entries(summary.typeCounts).map(([type, count]) => (
                                <div className="metric" key={type}>
                                    <strong>{count}</strong>
                                    <span>{type}</span>
                                </div>
                            ))}
                        </div>
                        <div className="type-count-grid" style={{ marginTop: 12 }}>
                            <div className="metric">
                                <strong>{summary.categoryCounts.good}</strong>
                                <span>好图</span>
                            </div>
                            <div className="metric">
                                <strong>{summary.categoryCounts.god}</strong>
                                <span>神图</span>
                            </div>
                            <div className="metric">
                                <strong>{summary.categoryCounts.poop}</strong>
                                <span>粪图</span>
                            </div>
                        </div>
                    </div>

                    <div className="panel panel-pad panel-strong">
                        <p className="section-title">总榜</p>
                        <div className="list" style={{ marginTop: 14 }}>
                            {summary.bestByMetric.overall.slice(0, 5).map(({ map, score, reviewCount }, index) => (
                                <div className="list-item" key={map.id}>
                                    <div className="list-row">
                                        <strong>{index + 1}. {map.name}</strong>
                                        <span className="badge">{score.toFixed(1)}</span>
                                    </div>
                                    <div className="list-row">
                                        <span>{map.type} · {map.code}</span>
                                        <span>{reviewCount} 条评价</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="panel panel-pad">
                    <p className="section-title">地图动态</p>
                    <div className="cover-grid">
                        {summary.maps.map((map) => (
                            <MapCard key={map.id} map={map} reviews={summary.reviews} />
                        ))}
                    </div>
                </section>

                <section className="panel panel-pad" id="submit-map">
                    <p className="section-title">上传地图</p>
                    <MapForm mapTypes={[...defaultMapTypes]} />
                </section>

                <section className="panel panel-pad" id="submit-review">
                    <p className="section-title">提交评价</p>
                    <ReviewForm maps={summary.maps} />
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
                        <p className="section-title">日志</p>
                        <HistoryList events={summary.events} />
                    </div>
                </section>
            </div>
        </main>
    );
}
