"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { MapCard } from "@/components/map-card";
import { averageRatings, getMapRatingLabel, getScoreBucketKey, matchesScoreBucket } from "@/lib/metrics";
import type { MapRecord, ReviewRecord } from "@/lib/types";
import titleIcon from "../../public/assets/icon.jpg";

type HomeMapExplorerProps = {
    maps: MapRecord[];
    reviews: ReviewRecord[];
    mapTypes: string[];
    typeCounts: Record<string, number>;
    categoryCounts: Record<"good" | "god" | "shenren" | "poop", number>;
    mapCount: number;
    reviewCount: number;
    updatedAt: string;
};

type ActiveFilter =
    | { kind: "all" }
    | { kind: "type"; value: string }
    | { kind: "category"; value: "good" | "god" | "shenren" | "poop" }
    | { kind: "score"; value: "0" | "1" | "2" | "3" | "4" };

type MapMeta = {
    map: MapRecord;
    score: number | null;
    ratingLabel: string | null;
    scoreBucket: string | null;
};

const PAGE_SIZE = 12;

const categoryLabel: Record<"good" | "god" | "shenren" | "poop", string> = {
    good: "好图",
    god: "神图",
    shenren: "神人图",
    poop: "史图"
};

export function HomeMapExplorer({ maps, reviews, mapTypes, typeCounts, categoryCounts, mapCount, reviewCount, updatedAt }: HomeMapExplorerProps) {
    const [filter, setFilter] = useState<ActiveFilter>({ kind: "all" });
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);

    const mapMeta = useMemo<MapMeta[]>(() => {
        return maps.map((map) => {
            const reviewCount = reviews.filter((review) => review.mapId === map.id && !review.deletedAt).length;
            const score = reviewCount > 0 ? averageRatings(reviews, map.id).overall : null;
            return {
                map,
                score,
                ratingLabel: getMapRatingLabel(reviews, map.id),
                scoreBucket: score === null ? null : getScoreBucketKey(score)
            };
        });
    }, [maps, reviews]);

    const scoreBuckets = useMemo(() => {
        const totals = { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0 };
        mapMeta.forEach((entry) => {
            if (entry.scoreBucket !== null) {
                totals[entry.scoreBucket as keyof typeof totals] += 1;
            }
        });
        return totals;
    }, [mapMeta]);

    const filteredMaps = useMemo(() => {
        const keyword = query.trim().toLowerCase();
        return mapMeta.filter((entry) => {
            if (filter.kind === "type" && entry.map.type !== filter.value) {
                return false;
            }
            if (filter.kind === "category" && entry.ratingLabel !== categoryLabel[filter.value]) {
                return false;
            }
            if (filter.kind === "score" && (entry.score === null || !matchesScoreBucket(entry.score, filter.value))) {
                return false;
            }
            if (!keyword) {
                return true;
            }
            return [entry.map.name, entry.map.author, entry.map.type, entry.map.code, entry.map.introduction]
                .some((value) => value?.toLowerCase().includes(keyword));
        });
    }, [filter, mapMeta, query]);

    const totalPages = Math.max(1, Math.ceil(filteredMaps.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageMaps = filteredMaps.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const activeFilterLabel = (() => {
        if (filter.kind === "all") return "全部地图";
        if (filter.kind === "type") return filter.value;
        if (filter.kind === "category") return categoryLabel[filter.value];
        if (filter.kind === "score") {
            if (filter.value === "4") return "4分以上";
            if (filter.value === "3") return "3分以上";
            if (filter.value === "2") return "2分以上";
            if (filter.value === "1") return "1分以上";
            return "0分以上";
        }
        return "全部地图";
    })();

    const applyFilter = (next: ActiveFilter) => {
        setFilter(next);
        setPage(1);
    };

    const applyQuery = (value: string) => {
        setQuery(value);
        setPage(1);
    };

    const goToPage = (next: number) => {
        const target = Math.max(1, Math.min(totalPages, next));
        if (target !== currentPage) {
            setPage(target);
        }
    };

    const pageItems = useMemo<Array<number | "gap">>(() => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, index) => index + 1);
        }
        const items: Array<number | "gap"> = [1];
        if (currentPage > 3) {
            items.push("gap");
        }
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let value = start; value <= end; value += 1) {
            items.push(value);
        }
        if (currentPage < totalPages - 2) {
            items.push("gap");
        }
        items.push(totalPages);
        return items;
    }, [currentPage, totalPages]);

    const renderFilterButton = (key: string, label: string, active: boolean, onClick: () => void, count?: number) => (
        <button className={`filter-chip${active ? " is-active" : ""}`} key={key} type="button" onClick={onClick}>
            {typeof count === "number" ? <strong>{count}</strong> : null}
            <span>{label}</span>
        </button>
    );

    return (
        <>
            <section className="grid home-map-explorer-grid">
                <div className="panel panel-pad overview-panel">
                    <div className="overview-heading">
                        <a href="https://space.bilibili.com/2199618" target="_blank" rel="noopener noreferrer" className="overview-icon-link">
                            <Image className="overview-icon" src={titleIcon} alt="标题图标" width={56} height={56} priority />
                        </a>
                        <div>
                            <p className="eyebrow">MAPS MARK · 地图评价站</p>
                            <h1 className="overview-title">是啊玩什么？</h1>
                            <p className="help overview-subtitle">卡丘工坊地图口碑广场，看看大家都在玩什么。</p>
                        </div>
                    </div>

                    <div className="overview-stat-grid">
                        <div className="overview-stat">
                            <strong>{mapCount}</strong>
                            <span>收录地图</span>
                        </div>
                        <div className="overview-stat">
                            <strong>{reviewCount}</strong>
                            <span>玩家评价</span>
                        </div>
                        <div className="overview-stat">
                            <strong>{mapTypes.length}</strong>
                            <span>地图类型</span>
                        </div>
                    </div>
                    <p className="overview-updated">最近更新 · {updatedAt}</p>
                </div>

                <div className="panel panel-pad panel-strong filter-panel">
                    <div className="filter-panel-head">
                        <p className="section-title filter-title">地图筛选</p>
                        <button
                            className={`page-button filter-reset${filter.kind === "all" ? " filter-reset-idle" : ""}`}
                            type="button"
                            onClick={() => applyFilter({ kind: "all" })}
                            disabled={filter.kind === "all"}
                            aria-hidden={filter.kind === "all"}
                        >
                            重置筛选
                        </button>
                    </div>

                    <div className="overview-filter-block">
                        <p className="overview-group-title">分数筛选</p>
                        <div className="filter-chip-grid">
                            {renderFilterButton("score-all", "显示全部", filter.kind === "all", () => applyFilter({ kind: "all" }), mapMeta.length)}
                            {renderFilterButton("score-4", "4分以上", filter.kind === "score" && filter.value === "4", () => applyFilter({ kind: "score", value: "4" }), scoreBuckets["4"])}
                            {renderFilterButton("score-3", "3分以上", filter.kind === "score" && filter.value === "3", () => applyFilter({ kind: "score", value: "3" }), scoreBuckets["3"])}
                            {renderFilterButton("score-2", "2分以上", filter.kind === "score" && filter.value === "2", () => applyFilter({ kind: "score", value: "2" }), scoreBuckets["2"])}
                            {renderFilterButton("score-1", "1分以上", filter.kind === "score" && filter.value === "1", () => applyFilter({ kind: "score", value: "1" }), scoreBuckets["1"])}
                            {renderFilterButton("score-0", "0分以上", filter.kind === "score" && filter.value === "0", () => applyFilter({ kind: "score", value: "0" }), scoreBuckets["0"])}
                        </div>

                        <p className="overview-group-title">地图类型</p>
                        <div className="filter-chip-grid">
                            {mapTypes.map((type) => renderFilterButton(`type-${type}`, type, filter.kind === "type" && filter.value === type, () => applyFilter({ kind: "type", value: type }), typeCounts[type] ?? 0))}
                        </div>

                        <p className="overview-group-title">地图评级</p>
                        <div className="filter-chip-grid">
                            {renderFilterButton("category-god", "神图", filter.kind === "category" && filter.value === "god", () => applyFilter({ kind: "category", value: "god" }), categoryCounts.god)}
                            {renderFilterButton("category-good", "好图", filter.kind === "category" && filter.value === "good", () => applyFilter({ kind: "category", value: "good" }), categoryCounts.good)}
                            {renderFilterButton("category-shenren", "神人图", filter.kind === "category" && filter.value === "shenren", () => applyFilter({ kind: "category", value: "shenren" }), categoryCounts.shenren)}
                            {renderFilterButton("category-poop", "史图", filter.kind === "category" && filter.value === "poop", () => applyFilter({ kind: "category", value: "poop" }), categoryCounts.poop)}
                        </div>
                    </div>

                    <div className="overview-filter-summary">
                        <span>当前筛选 · {activeFilterLabel}{query.trim() ? ` · 搜索「${query.trim()}」` : ""}</span>
                        <span>匹配 {filteredMaps.length} / {mapMeta.length} 张</span>
                    </div>
                </div>
            </section>

            <section className="panel panel-pad map-results-panel" id="map-results">
                <div className="results-head">
                    <div>
                        <p className="eyebrow">PLAZA</p>
                        <h2 className="section-title results-title">地图广场</h2>
                    </div>
                    <div className="map-search">
                        <span className="map-search-icon" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="7" />
                                <path d="m20 20-3.5-3.5" />
                            </svg>
                        </span>
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => applyQuery(event.target.value)}
                            placeholder="搜索地图名、作者、类型或代码"
                            aria-label="搜索地图"
                        />
                        {query ? (
                            <button className="map-search-clear" type="button" onClick={() => applyQuery("")} aria-label="清空搜索">
                                ×
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className="results-meta" aria-live="polite">
                    <span>{activeFilterLabel}{query.trim() ? ` · 「${query.trim()}」` : ""}</span>
                    <span>共 {filteredMaps.length} 张地图 · 第 {currentPage} / {totalPages} 页</span>
                </div>

                {pageMaps.length ? (
                    <div className="map-grid">
                        {pageMaps.map(({ map }) => (
                            <MapCard key={map.id} map={map} reviews={reviews} />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <strong>没有找到符合条件的地图</strong>
                        <p>试试更换关键词，或清空筛选条件重新浏览。</p>
                        <button
                            className="button button-primary button-rect"
                            type="button"
                            onClick={() => {
                                applyQuery("");
                                applyFilter({ kind: "all" });
                            }}
                        >
                            清空搜索与筛选
                        </button>
                    </div>
                )}

                {totalPages > 1 ? (
                    <nav className="pagination" aria-label="地图分页">
                        <button className="page-button page-arrow" type="button" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>
                            上一页
                        </button>
                        <div className="page-numbers">
                            {pageItems.map((item, index) =>
                                item === "gap" ? (
                                    <span className="page-gap" key={`gap-${index}`}>…</span>
                                ) : (
                                    <button
                                        className={`page-button${item === currentPage ? " is-active" : ""}`}
                                        type="button"
                                        key={item}
                                        onClick={() => goToPage(item)}
                                        aria-current={item === currentPage ? "page" : undefined}
                                    >
                                        {item}
                                    </button>
                                )
                            )}
                        </div>
                        <button className="page-button page-arrow" type="button" disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>
                            下一页
                        </button>
                    </nav>
                ) : null}
            </section>
        </>
    );
}
