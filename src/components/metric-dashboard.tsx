"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { averageRatings } from "@/lib/metrics";
import { ratingLabelText, ratingLabels, type MapRecord, type RatingDimensions, type ReviewRecord } from "@/lib/types";

type MetricDashboardProps = {
    maps: MapRecord[];
    reviews: ReviewRecord[];
    initialSelected?: Array<keyof RatingDimensions>;
};

type MapMetric = {
    map: MapRecord;
    ratings: RatingDimensions;
    reviewCount: number;
};

const clampScore = (value: number) => Math.max(-5, Math.min(5, value));
const toPercent = (value: number) => ((clampScore(value) + 5) / 10) * 100;
const cardOffsets = [
    { x: 14, y: -66, side: "right" as const },
    { x: 14, y: 10, side: "right" as const },
    { x: -186, y: -66, side: "left" as const },
    { x: -186, y: 10, side: "left" as const },
    { x: 14, y: -132, side: "right" as const },
    { x: -186, y: -132, side: "left" as const }
];

const metricKeys = ratingLabels;

const sortByMetric = (left: MapMetric, right: MapMetric, metric: keyof RatingDimensions) => {
    const scoreGap = right.ratings[metric] - left.ratings[metric];
    if (scoreGap !== 0) {
        return scoreGap;
    }
    return right.reviewCount - left.reviewCount;
};

export function MetricDashboard({ maps, reviews, initialSelected = ["overall"] }: MetricDashboardProps) {
    const [selected, setSelected] = useState<Array<keyof RatingDimensions>>(initialSelected.length ? initialSelected.slice(0, 2) : ["overall"]);

    const mapMetrics = useMemo<MapMetric[]>(() => {
        return maps.map((map) => {
            const mapReviews = reviews.filter((review) => review.mapId === map.id && !review.deletedAt);
            return {
                map,
                ratings: averageRatings(reviews, map.id),
                reviewCount: mapReviews.length
            };
        });
    }, [maps, reviews]);

    const activeDimensions = (selected.length > 0 ? selected.slice(0, 2) : ["overall"]) as Array<keyof RatingDimensions>;
    const canAddMore = activeDimensions.length < 2;

    const toggle = (key: keyof RatingDimensions) => {
        setSelected((current) => {
            const next = current.filter((item) => item !== key);
            if (next.length === current.length) {
                if (current.length >= 2) {
                    return current;
                }
                return [...current, key].slice(0, 2);
            }
            if (next.length === 0) {
                return current;
            }
            return next;
        });
    };

    const renderSingleAxis = (metric: keyof RatingDimensions) => {
        const ordered = [...mapMetrics].sort((left, right) => sortByMetric(left, right, metric));
        const height = Math.max(420, ordered.length * 64 + 72);

        return (
            <div className="metric-stage metric-stage-single" style={{ minHeight: height }}>
                <div className="metric-axis metric-axis-horizontal" aria-hidden="true" />
                <div className="metric-axis-label metric-axis-label-left">-5</div>
                <div className="metric-axis-label metric-axis-label-center">0</div>
                <div className="metric-axis-label metric-axis-label-right">5</div>
                {ordered.map((entry, index) => {
                    const left = toPercent(entry.ratings[metric]);
                    return (
                        <Link
                            key={entry.map.id}
                            href={`/maps/${entry.map.id}`}
                            className="metric-node metric-node-single"
                            style={{ left: `${left}%`, top: `${18 + index * 60}px`, zIndex: String(ordered.length - index) }}
                            title={`${entry.map.name} · 点击查看详情`}
                        >
                            <img src={entry.map.coverImage} alt={entry.map.name} className="metric-node-cover" />
                            <div className="metric-node-body">
                                <strong>{entry.map.name}</strong>
                                <span>{entry.map.type} · {entry.map.code}</span>
                                <span>{ratingLabelText[metric]}：{entry.ratings[metric].toFixed(1)}</span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        );
    };

    const renderDualAxis = (xMetric: keyof RatingDimensions, yMetric: keyof RatingDimensions) => {
        const clustered = new Map<string, number>();
        const points = [...mapMetrics].sort((left, right) => sortByMetric(left, right, xMetric));

        return (
            <div className="metric-stage metric-stage-double">
                <div className="metric-plot-grid" aria-hidden="true" />
                <div className="metric-axis metric-axis-x" aria-hidden="true" />
                <div className="metric-axis metric-axis-y" aria-hidden="true" />
                <div className="metric-axis-label metric-axis-label-bottom-left">{ratingLabelText[xMetric]}</div>
                <div className="metric-axis-label metric-axis-label-top-left">{ratingLabelText[yMetric]}</div>
                <div className="metric-axis-label metric-axis-label-left">-5</div>
                <div className="metric-axis-label metric-axis-label-center">0</div>
                <div className="metric-axis-label metric-axis-label-right">5</div>
                {points.map((entry) => {
                    const x = toPercent(entry.ratings[xMetric]);
                    const y = toPercent(entry.ratings[yMetric]);
                    const clusterKey = `${Math.round(x / 12)}-${Math.round(y / 12)}`;
                    const clusterIndex = clustered.get(clusterKey) ?? 0;
                    clustered.set(clusterKey, clusterIndex + 1);
                    const offset = cardOffsets[clusterIndex % cardOffsets.length];

                    return (
                        <div key={entry.map.id} className="metric-scatter-point" style={{ left: `${x}%`, top: `${100 - y}%`, zIndex: String(100 + clusterIndex) }}>
                            <span className="metric-scatter-dot" />
                            <Link
                                href={`/maps/${entry.map.id}`}
                                className={`metric-scatter-card metric-scatter-card-${offset.side}`}
                                style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
                                title={`${entry.map.name} · 点击查看详情`}
                            >
                                <img src={entry.map.coverImage} alt={entry.map.name} className="metric-node-cover" />
                                <div className="metric-node-body">
                                    <strong>{entry.map.name}</strong>
                                    <span>{entry.map.type} · {entry.map.code}</span>
                                    <span>{ratingLabelText[xMetric]} {entry.ratings[xMetric].toFixed(1)} / {ratingLabelText[yMetric]} {entry.ratings[yMetric].toFixed(1)}</span>
                                </div>
                            </Link>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="metric-explorer">
            <div className="metric-controls">
                <div>
                    <p className="help" style={{ margin: 0 }}>勾选 1 个维度时显示单维轴图，勾选 2 个维度时显示二维坐标图，不能超过 2 个。</p>
                    <p className="help" style={{ marginTop: 8 }}>当前：{activeDimensions.map((dimension) => ratingLabelText[dimension]).join(" + ")}</p>
                </div>
                <div className="metric-choice-grid">
                    {metricKeys.map((key) => {
                        const isSelected = activeDimensions.includes(key);
                        const disabled = !isSelected && !canAddMore;
                        return (
                            <label className={`metric-choice${isSelected ? " is-selected" : ""}${disabled ? " is-disabled" : ""}`} key={key}>
                                <input checked={isSelected} disabled={disabled} onChange={() => toggle(key)} type="checkbox" />
                                <span>{ratingLabelText[key]}</span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {activeDimensions.length === 1 ? renderSingleAxis(activeDimensions[0]) : renderDualAxis(activeDimensions[0], activeDimensions[1])}
        </div>
    );
}
