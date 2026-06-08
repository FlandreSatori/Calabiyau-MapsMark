"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { MapCard } from "@/components/map-card";
import { averageRatings, getMapRatingLabel, getScoreBucketKey, matchesScoreBucket } from "@/lib/metrics";
import type { MapRecord, ReviewRecord } from "@/lib/types";
import titleIcon from "../../assets/images/icon.jpg";

type HomeMapExplorerProps = {
    maps: MapRecord[];
    reviews: ReviewRecord[];
    mapTypes: string[];
    typeCounts: Record<string, number>;
    categoryCounts: Record<"good" | "god" | "shenren" | "poop", number>;
    mapCount: number;
    reviewCount: number;
    updatedAt: string;
    topOverall: Array<{
        map: MapRecord;
        score: number;
        reviewCount: number;
    }>;
};

type ActiveFilter =
    | { kind: "all" }
    | { kind: "type"; value: string }
    | { kind: "category"; value: "good" | "god" | "shenren" | "poop" }
    | { kind: "score"; value: "0" | "1" | "2" | "3" | "4" };

type MapMeta = {
    map: MapRecord;
    score: number;
    ratingLabel: string | null;
    scoreBucket: string;
};

export function HomeMapExplorer({ maps, reviews, mapTypes, typeCounts, categoryCounts, mapCount, reviewCount, updatedAt, topOverall }: HomeMapExplorerProps) {
    const [filter, setFilter] = useState<ActiveFilter>({ kind: "all" });

    const mapMeta = useMemo<MapMeta[]>(() => {
        return maps.map((map) => {
            const score = averageRatings(reviews, map.id).overall;
            return {
                map,
                score,
                ratingLabel: getMapRatingLabel(reviews, map.id),
                scoreBucket: getScoreBucketKey(score)
            };
        });
    }, [maps, reviews]);

    const scoreBuckets = useMemo(() => {
        const totals = { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0 };
        mapMeta.forEach((entry) => {
            totals[entry.scoreBucket as keyof typeof totals] += 1;
        });
        return totals;
    }, [mapMeta]);

    const filteredMaps = useMemo(() => {
        return mapMeta.filter((entry) => {
            if (filter.kind === "all") {
                return true;
            }
            if (filter.kind === "type") {
                return entry.map.type === filter.value;
            }
            if (filter.kind === "category") {
                return entry.ratingLabel === ({ good: "好图", god: "神图", shenren: "神人图", poop: "史图" }[filter.value]);
            }
            if (filter.kind === "score") {
                return matchesScoreBucket(entry.score, filter.value);
            }
            return false;
        });
    }, [filter, mapMeta]);

    const activeFilterLabel = (() => {
        if (filter.kind === "all") return "全部";
        if (filter.kind === "type") return filter.value;
        if (filter.kind === "category") return ({ good: "好图", god: "神图", shenren: "神人图", poop: "史图" }[filter.value]);
        if (filter.kind === "score") {
            if (filter.value === "4") return "4分以上";
            if (filter.value === "3") return "3分以上";
            if (filter.value === "2") return "2分以上";
            if (filter.value === "1") return "1分以上";
            return "0分以上";
        }
        return "全部";
    })();

    const renderFilterButton = (key: string, label: string, active: boolean, onClick: () => void, count?: number) => (
        <button className={`filter-chip${active ? " is-active" : ""}`} key={key} type="button" onClick={onClick}>
            {typeof count === "number" ? <strong>{count}</strong> : null}
            <span>{label}</span>
        </button>
    );

    return (
        <>
            <section className="grid home-map-explorer-grid">
                <div className="panel panel-pad">
                    <div className="overview-heading">
                        <Image className="overview-icon" src={titleIcon} alt="标题图标" width={56} height={56} priority />
                        <div>
                            <p className="section-title overview-title">是啊玩什么？</p>
                            <p className="help overview-subtitle">请做出评价吧！</p>
                        </div>
                    </div>

                    <div className="stat-strip overview-summary-strip" style={{ marginTop: 18 }}>
                        <span className="stat">地图数 {mapCount}</span>
                        <span className="stat">评价数 {reviewCount}</span>
                        <span className="stat">更新时间 {updatedAt}</span>
                    </div>

                    <div className="overview-filter-block">
                        <p className="overview-group-title">分数筛选</p>
                        <div className="filter-chip-grid">
                            {renderFilterButton("score-all", "显示全部", filter.kind === "all", () => setFilter({ kind: "all" }), mapMeta.length)}
                            {renderFilterButton("score-4", "4分以上", filter.kind === "score" && filter.value === "4", () => setFilter({ kind: "score", value: "4" }), scoreBuckets["4"])}
                            {renderFilterButton("score-3", "3分以上", filter.kind === "score" && filter.value === "3", () => setFilter({ kind: "score", value: "3" }), scoreBuckets["3"])}
                            {renderFilterButton("score-2", "2分以上", filter.kind === "score" && filter.value === "2", () => setFilter({ kind: "score", value: "2" }), scoreBuckets["2"])}
                            {renderFilterButton("score-1", "1分以上", filter.kind === "score" && filter.value === "1", () => setFilter({ kind: "score", value: "1" }), scoreBuckets["1"])}
                            {renderFilterButton("score-0", "0分以上", filter.kind === "score" && filter.value === "0", () => setFilter({ kind: "score", value: "0" }), scoreBuckets["0"])}
                        </div>

                        <p className="overview-group-title">地图类型</p>
                        <div className="filter-chip-grid">
                            {mapTypes.map((type) => renderFilterButton(`type-${type}`, type, filter.kind === "type" && filter.value === type, () => setFilter({ kind: "type", value: type }), typeCounts[type] ?? 0))}
                        </div>

                        <p className="overview-group-title">地图评级</p>
                        <div className="filter-chip-grid">
                            {renderFilterButton("category-god", "神图", filter.kind === "category" && filter.value === "god", () => setFilter({ kind: "category", value: "god" }), categoryCounts.god)}
                            {renderFilterButton("category-good", "好图", filter.kind === "category" && filter.value === "good", () => setFilter({ kind: "category", value: "good" }), categoryCounts.good)}
                            {renderFilterButton("category-shenren", "神人图", filter.kind === "category" && filter.value === "shenren", () => setFilter({ kind: "category", value: "shenren" }), categoryCounts.shenren)}
                            {renderFilterButton("category-poop", "史图", filter.kind === "category" && filter.value === "poop", () => setFilter({ kind: "category", value: "poop" }), categoryCounts.poop)}
                        </div>
                    </div>

                    <div className="overview-filter-summary">
                        <span>当前筛选：{activeFilterLabel}</span>
                        <span>匹配地图 {filteredMaps.length} / {mapMeta.length}</span>
                    </div>
                </div>

                <div className="panel panel-pad panel-strong">
                    <p className="section-title">总榜</p>
                    <div className="list" style={{ marginTop: 14 }}>
                        {topOverall.map(({ map, score, reviewCount }, index) => (
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
                {filteredMaps.length ? (
                    <div className="cover-grid">
                        {filteredMaps.map(({ map }) => (
                            <MapCard key={map.id} map={map} reviews={reviews} />
                        ))}
                    </div>
                ) : (
                    <p className="help" style={{ marginBottom: 0 }}>没有符合当前筛选条件的地图。</p>
                )}
            </section>
        </>
    );
}
