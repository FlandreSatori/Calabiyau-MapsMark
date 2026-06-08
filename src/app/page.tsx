import Image from "next/image";

import { MapForm } from "@/components/forms";
import { HistoryList } from "@/components/history-list";
import { MapCard } from "@/components/map-card";
// 使用表单内部的全局通知（避免从服务器组件传函数到客户端）
// 当前网页需要在vercel远端构建，谨慎处理客户端函数
import { formatDateTime } from "@/lib/format";
import { buildTime } from "@/lib/build-meta";
import { loadState } from "@/lib/github-store";
import { summarizeState } from "@/lib/state-utils";
import { defaultMapTypes } from "@/lib/types";
import titleIcon from "../../assets/images/icon.jpg";

export default async function HomePage({ searchParams }: { searchParams?: { bg?: string } }) {
    const state = await loadState();
    const summary = summarizeState(state);
    const background = searchParams?.bg ?? state.ui?.background;
    const allMapTypes = Array.from(new Set([...defaultMapTypes, ...Object.keys(summary.typeCounts)]));

    return (
        <main className="app-shell" style={background ? { background } : undefined}>
            <div className="container grid gap-18">
                <section className="grid grid-hero">
                    <div className="panel panel-pad">
                        <div className="overview-heading">
                            <Image className="overview-icon" src={titleIcon} alt="标题图标" width={56} height={56} priority />
                            <div>
                                <p className="section-title overview-title">是啊玩什么？</p>
                                <p className="help overview-subtitle">请做出评价吧！</p>
                            </div>
                        </div>

                        <div className="stat-strip overview-summary-strip" style={{ marginTop: 18 }}>
                            <span className="stat">地图数 {summary.mapCount}</span>
                            <span className="stat">评价数 {summary.reviewCount}</span>
                            <span className="stat">更新时间 {formatDateTime(state.updatedAt)}</span>
                        </div>

                        <p className="overview-group-title">地图类型</p>
                        <div className="type-count-grid" style={{ marginTop: 12 }}>
                            {allMapTypes.map((type) => (
                                <div className="metric" key={type}>
                                    <strong>{summary.typeCounts[type] ?? 0}</strong>
                                    <span>{type}</span>
                                </div>
                            ))}
                        </div>

                        <p className="overview-group-title">地图评级</p>
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
                                <strong>{summary.categoryCounts.shenren}</strong>
                                <span>神人图</span>
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

                <section className="panel panel-pad">
                    <p className="section-title">日志</p>
                    <HistoryList events={summary.events} maps={summary.maps} reviews={summary.reviews} mode="split" />
                </section>

            </div>
        </main>
    );
}
