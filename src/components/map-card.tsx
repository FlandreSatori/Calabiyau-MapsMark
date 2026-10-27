"use client";

import Link from "next/link";

import { FallbackImage } from "@/components/fallback-image";
import type { MapRecord, ReviewRecord } from "@/lib/types";
import { averageRatings } from "@/lib/metrics";

type MapCardProps = {
    map: MapRecord;
    reviews: ReviewRecord[];
};

export function MapCard({ map, reviews }: MapCardProps) {
    const reviewCount = reviews.filter((review) => review.mapId === map.id && !review.deletedAt).length;
    const score = reviewCount > 0 ? averageRatings(reviews, map.id).overall : null;
    const authorHref = `/authors/${encodeURIComponent(map.author)}`;

    return (
        <article className="map-card">
            <Link className="map-card-media" href={`/maps/${map.id}`} aria-label={`查看 ${map.name} 详情`} title={`${map.name} · 点击查看详情`}>
                <FallbackImage src={map.coverImage} alt={map.name} />
            </Link>
            <div className="map-card-body">
                <Link className="map-card-title" href={`/maps/${map.id}`}>{map.name}</Link>
                <div className="map-card-meta">
                    <Link className="author-link" href={authorHref} title={`查看 ${map.author} 的全部地图`}>
                        {map.author}
                    </Link>
                    {score !== null ? (
                        <span className="map-score" title={`综合评分 ${score.toFixed(1)} · ${reviewCount} 条评价`}>
                            {score.toFixed(1)}
                        </span>
                    ) : null}
                </div>
            </div>
        </article>
    );
}
