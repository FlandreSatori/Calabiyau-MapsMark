import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MapCard } from "@/components/map-card";
import { loadState } from "@/lib/github-store";
import { summarizeState } from "@/lib/state-utils";
import { averageRatings } from "@/lib/metrics";

export const dynamic = "force-dynamic";

const decodeAuthorName = (value: string) => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
    const { name } = await params;
    const authorName = decodeAuthorName(name);
    return {
        title: `${authorName} 的地图 · MapsMark`,
        description: `${authorName} 在 MapsMark 上提交的全部地图作品。`
    };
}

export default async function AuthorPage({ params }: { params: Promise<{ name: string }> }) {
    const { name } = await params;
    const authorName = decodeAuthorName(name);

    const state = await loadState();
    const summary = summarizeState(state);
    const authorMaps = summary.maps
        .filter((map) => map.author === authorName)
        .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt));

    if (!authorMaps.length) {
        notFound();
    }

    const mapIds = new Set(authorMaps.map((map) => map.id));
    const authorReviews = summary.reviews.filter((review) => mapIds.has(review.mapId));
    const averageScore = authorReviews.length > 0 ? averageRatings(authorReviews).overall : null;
    const types = Array.from(new Set(authorMaps.map((map) => map.type)));

    return (
        <main className="app-shell">
            <div className="container grid gap-18">
                <section className="panel panel-pad author-hero">
                    <Link className="back-link" href="/">← 返回地图广场</Link>

                    <div className="author-hero-main">
                        <div className="author-hero-info">
                            <p className="eyebrow">CREATOR · 作者主页</p>
                            <h1 className="author-hero-name">{authorName}</h1>
                            <p className="help author-hero-sub">共 {authorMaps.length} 张地图 · {types.join(" / ")}</p>
                        </div>
                    </div>

                    <div className="overview-stat-grid">
                        <div className="overview-stat">
                            <strong>{authorMaps.length}</strong>
                            <span>地图作品</span>
                        </div>
                        <div className="overview-stat">
                            <strong>{authorReviews.length}</strong>
                            <span>收到评价</span>
                        </div>
                        <div className="overview-stat">
                            <strong>{averageScore === null ? "N/A" : averageScore.toFixed(1)}</strong>
                            <span>平均总分</span>
                        </div>
                    </div>
                </section>

                <section className="panel panel-pad">
                    <div className="results-head">
                        <div>
                            <p className="eyebrow">WORKS</p>
                            <h2 className="section-title results-title">全部地图</h2>
                        </div>
                        <span className="author-work-count">{authorMaps.length} 张作品</span>
                    </div>
                    <div className="map-grid">
                        {authorMaps.map((map) => (
                            <MapCard key={map.id} map={map} reviews={summary.reviews} />
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
