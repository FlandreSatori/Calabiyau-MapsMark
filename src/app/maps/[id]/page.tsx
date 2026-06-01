import Link from "next/link";
import { notFound } from "next/navigation";

import { RadarChart } from "@/components/radar-chart";
import { ReviewForm } from "@/components/forms";
import { HistoryList } from "@/components/history-list";
import { CopyButton } from "@/components/copy-button";
import { loadState } from "@/lib/github-store";
import { summarizeState } from "@/lib/state-utils";
import { formatDateTime, getProxiedGithubUrl } from "@/lib/format";
import { getMapById } from "@/lib/metrics";
import { ratingLabels, ratingLabelText } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MapDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const state = await loadState();
    const map = getMapById(state, id);
    if (!map) {
        notFound();
    }
    const summary = summarizeState(state);
    const reviews = summary.reviews.filter((review) => review.mapId === map.id);
    const gallery = [
        { src: map.coverImage, label: "封面图" },
        { src: map.previewImage, label: "预览图" }
    ].filter((item) => Boolean(item.src));

    const average = reviews.length
        ? reviews.reduce(
            (accumulator, review) => {
                accumulator.entertainment += review.ratings.entertainment;
                accumulator.aesthetics += review.ratings.aesthetics;
                accumulator.guidance += review.ratings.guidance;
                accumulator.difficulty += review.ratings.difficulty;
                accumulator.overall += review.ratings.overall;
                return accumulator;
            },
            { entertainment: 0, aesthetics: 0, guidance: 0, difficulty: 0, overall: 0 }
        )
        : { entertainment: 0, aesthetics: 0, guidance: 0, difficulty: 0, overall: 0 };

    if (reviews.length) {
        Object.keys(average).forEach((key) => {
            average[key as keyof typeof average] /= reviews.length;
        });
    }

    return (
        <main className="app-shell">
            <div className="container grid gap-18">
                <Link className="pill" href="/">
                    ← 返回首页
                </Link>
                <section className="detail-layout">
                    <div className="panel panel-pad">
                        <p className="section-title">Map Detail</p>
                        <h1 className="hero-title" style={{ fontSize: "2.6rem" }}>{map.name}</h1>
                        <div className="stat-strip">
                            <span className="stat">{map.type}</span>
                            <span className="stat">{map.code}</span>
                            <span className="stat">{map.author}</span>
                            <span className="stat">{map.estimatedMinutes}分钟</span>
                        </div>
                        <p className="hero-text map-introduction">{map.introduction}</p>
                        <div className="map-gallery" style={{ marginTop: 18 }}>
                            <div className="map-gallery-track">
                                {gallery.map((image) => (
                                    <figure className="map-gallery-item" key={`${map.id}-${image.label}`}>
                                        <div className="preview-frame map-gallery-frame">
                                            <img src={getProxiedGithubUrl(image.src)} alt={`${map.name} ${image.label}`} suppressHydrationWarning />
                                        </div>
                                        <figcaption className="help map-gallery-caption">{image.label}</figcaption>
                                    </figure>
                                ))}
                            </div>
                            <div className="panel panel-pad panel-strong">
                                <div className="copy-section">
                                    <div>
                                        <strong>地图代码</strong>
                                        <p className="hero-text copy-code-value">{map.code}</p>
                                    </div>
                                    <CopyButton value={map.code} label="复制代码" successMessage="地图代码已复制到剪贴板。" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="panel panel-pad">
                        <p className="section-title">Radar</p>
                        <RadarChart values={average} dimensions={ratingLabels.slice(0, 5)} size={360} />
                        <div className="legend-grid">
                            {reviews.length ? (
                                ratingLabels.map((label) => {
                                    const value = average[label as keyof typeof average] ?? 0;
                                    return (
                                        <div className="legend-row" key={label}>
                                            <span>{ratingLabelText[label]}</span>
                                            <strong>{value.toFixed(1)}</strong>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="help">目前还没有评价。</p>
                            )}
                        </div>
                    </div>
                </section>

                <section className="panel panel-pad">
                    <p className="section-title">提交评价</p>
                    <ReviewForm maps={[map]} />
                </section>

                <section className="grid grid-hero">
                    <div className="panel panel-pad">
                        <p className="section-title">Reviews</p>
                        <div className="list">
                            {reviews.map((review) => (
                                <div className="list-item" key={review.id}>
                                    <div className="list-row">
                                        <strong>{review.anonymous ? "匿名" : review.reviewerName}</strong>
                                        <span className="badge">{formatDateTime(review.submittedAt)}</span>
                                    </div>
                                    <div className="stat-strip">
                                        {ratingLabels.map((key) => (
                                            <span className="stat" key={key}>{ratingLabelText[key]} {review.ratings[key].toFixed(1)}</span>
                                        ))}
                                    </div>
                                    <p className="hero-text review-comment-text" style={{ marginBottom: 0 }}>{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="panel panel-pad">
                        <p className="section-title">History</p>
                        <HistoryList events={state.events.filter((event) => event.subjectId === map.id || event.detail === map.code)} />
                    </div>
                </section>
            </div>
        </main>
    );
}
