"use client";

import Link from "next/link";

import { FallbackImage } from "@/components/fallback-image";
import type { MapRecord, ReviewRecord } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { averageRatings, getMapRatingLabel } from "@/lib/metrics";

type MapCardProps = {
    map: MapRecord;
    reviews: ReviewRecord[];
};

export function MapCard({ map, reviews }: MapCardProps) {
    const score = averageRatings(reviews, map.id);
    const reviewCount = reviews.filter((review) => review.mapId === map.id && !review.deletedAt).length;
    const ratingLabel = reviewCount > 0 ? getMapRatingLabel(reviews, map.id) : null;

    return (
        <Link href={`/maps/${map.id}`} className="cover-card" title={`${map.name} · 点击查看详情`}>
            <FallbackImage
                src={map.coverImage}
                customSrc={map.customCoverImage}
                alt={map.name}
            />
            <div className="cover-corners" aria-hidden="true">
                <div className="cover-corner-stack">
                    <span className="cover-corner-badge cover-corner-score">{score.overall.toFixed(1)}</span>
                    {ratingLabel ? <span className="cover-corner-badge cover-corner-tag">{ratingLabel}</span> : null}
                </div>
                <span className="cover-corner-badge cover-corner-reviews">{reviewCount} 条评价</span>
            </div>
            <div className="cover-overlay">
                <h3 className="card-title">{map.name}</h3>
                <div className="card-meta">
                    <div>{map.author}</div>
                    <div>{map.type} · {map.code}</div>
                    <div>{formatDateTime(map.submittedAt)}</div>
                </div>
            </div>
        </Link>
    );
}
