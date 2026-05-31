"use client";

import Link from "next/link";

import type { MapRecord, ReviewRecord } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { averageRatings } from "@/lib/metrics";

type MapCardProps = {
    map: MapRecord;
    reviews: ReviewRecord[];
};

export function MapCard({ map, reviews }: MapCardProps) {
    const score = averageRatings(reviews, map.id);
    return (
        <Link href={`/maps/${map.id}`} className="cover-card" title={`${map.name} · 点击查看详情`}>
            <img src={map.coverImage} alt={map.name} />
            <div className="cover-overlay">
                <h3 className="card-title">{map.name}</h3>
                <div className="card-meta">
                    <div>{map.author}</div>
                    <div>{map.type} · {map.code}</div>
                    <div>{formatDateTime(map.submittedAt)}</div>
                    <div>综合评分：{score.overall.toFixed(1)}</div>
                </div>
            </div>
        </Link>
    );
}
