"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useEffect } from "react";

import { MapCard } from "@/components/map-card";
import { formatDateTime, resolveMapImageUrl } from "@/lib/format";
import { averageRatings, getMapRatingLabel, getScoreBucketKey, matchesScoreBucket } from "@/lib/metrics";
import { ratingLabelText, ratingLabels, type MapRecord, type ReviewRecord } from "@/lib/types";
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
const REVIEW_AUTO_INITIAL = 4;
const REVIEW_GROUP_AUTO_INITIAL = 2;

type ExplorerView = "maps" | "reviews";
type ReviewSort = "newest" | "oldest" | "map";
type ReviewPageMode = "auto" | 5 | 10 | 20;

const reviewSortLabels: Record<ReviewSort, string> = {
    newest: "新到旧",
    oldest: "旧到新",
    map: "按地图"
};

const buildPageItems = (currentPage: number, totalPages: number): Array<number | "gap"> => {
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
};

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
    const [view, setView] = useState<ExplorerView>("maps");
    const [reviewSort, setReviewSort] = useState<ReviewSort>("newest");
    const [reviewPage, setReviewPage] = useState(1);
    const [reviewPageMode, setReviewPageMode] = useState<ReviewPageMode>("auto");
    const [autoFlatSize, setAutoFlatSize] = useState(REVIEW_AUTO_INITIAL);
    const [autoGroupSize, setAutoGroupSize] = useState(REVIEW_GROUP_AUTO_INITIAL);
    const reviewListRef = useRef<HTMLDivElement>(null);
    const reviewAutoMeasureRef = useRef(true);

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

    const reviewEntries = useMemo(() => {
        const mapById = new Map(maps.map((map) => [map.id, map]));
        return reviews
            .filter((review) => mapById.has(review.mapId))
            .map((review) => ({ review, map: mapById.get(review.mapId)! }));
    }, [maps, reviews]);

    const sortedReviews = useMemo(() => {
        const entries = [...reviewEntries];
        entries.sort((a, b) => {
            if (reviewSort === "map") {
                const nameDiff = a.map.name.localeCompare(b.map.name, "zh-Hans-CN");
                if (nameDiff !== 0) {
                    return nameDiff;
                }
            }
            const timeDiff = new Date(a.review.submittedAt).getTime() - new Date(b.review.submittedAt).getTime();
            return reviewSort === "oldest" ? timeDiff : -timeDiff;
        });
        return entries;
    }, [reviewEntries, reviewSort]);

    const reviewGroups = useMemo(() => {
        const groups = new Map<string, { map: MapRecord; reviews: ReviewRecord[] }>();
        sortedReviews.forEach(({ map, review }) => {
            const group = groups.get(map.id) ?? { map, reviews: [] };
            group.reviews.push(review);
            groups.set(map.id, group);
        });
        return Array.from(groups.values());
    }, [sortedReviews]);

    const flatReviewPageSize = reviewPageMode === "auto" ? autoFlatSize : reviewPageMode;
    const groupReviewPageSize = reviewPageMode === "auto" ? autoGroupSize : reviewPageMode;
    const reviewTotalPages =
        reviewSort === "map"
            ? Math.max(1, Math.ceil(reviewGroups.length / groupReviewPageSize))
            : Math.max(1, Math.ceil(sortedReviews.length / flatReviewPageSize));
    const currentReviewPage = Math.min(reviewPage, reviewTotalPages);
    const pagedReviews = sortedReviews.slice((currentReviewPage - 1) * flatReviewPageSize, currentReviewPage * flatReviewPageSize);
    const pagedReviewGroups = reviewGroups.slice((currentReviewPage - 1) * groupReviewPageSize, currentReviewPage * groupReviewPageSize);
    const reviewPageItems = useMemo(() => buildPageItems(currentReviewPage, reviewTotalPages), [currentReviewPage, reviewTotalPages]);

    useEffect(() => {
        reviewAutoMeasureRef.current = true;
        setReviewPage(1);
    }, [view, reviewSort, reviewPageMode]);

    useEffect(() => {
        if (view !== "reviews" || reviewPageMode !== "auto" || !reviewAutoMeasureRef.current) {
            return;
        }
        const list = reviewListRef.current;
        if (!list) {
            return;
        }
        const selector = reviewSort === "map" ? ".review-group" : ".review-row-feed";
        const items = Array.from(list.querySelectorAll<HTMLElement>(selector));
        if (!items.length) {
            return;
        }
        const heights = items.map((item) => item.getBoundingClientRect().height);
        const targetHeight = Math.max(900, window.innerHeight * 1.5);
        let accumulated = 0;
        let fitted = 0;
        for (const height of heights) {
            const next = accumulated + height + (fitted > 0 ? 16 : 0);
            if (next > targetHeight) {
                break;
            }
            accumulated = next;
            fitted += 1;
        }
        const nextSize = reviewSort === "map" ? Math.max(1, Math.min(20, fitted)) : Math.max(2, Math.min(12, fitted));
        if (reviewSort === "map") {
            setAutoGroupSize(nextSize);
        } else {
            setAutoFlatSize(nextSize);
        }
        reviewAutoMeasureRef.current = false;
        setReviewPage(1);
    }, [view, reviewSort, reviewPageMode, reviewPage, sortedReviews.length, reviewGroups.length]);

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

    const applyReviewSort = (next: ReviewSort) => {
        setReviewSort(next);
        setReviewPage(1);
    };

    const applyReviewPageMode = (next: ReviewPageMode) => {
        setReviewPageMode(next);
        setReviewPage(1);
    };

    const goToReviewPage = (next: number) => {
        const target = Math.max(1, Math.min(reviewTotalPages, next));
        if (target !== currentReviewPage) {
            setReviewPage(target);
            requestAnimationFrame(() => {
                reviewListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        }
    };

    const pageItems = useMemo(() => buildPageItems(currentPage, totalPages), [currentPage, totalPages]);

    const renderFilterButton = (key: string, label: string, active: boolean, onClick: () => void, count?: number) => (
        <button className={`filter-chip${active ? " is-active" : ""}`} key={key} type="button" onClick={onClick}>
            {typeof count === "number" ? <strong>{count}</strong> : null}
            <span>{label}</span>
        </button>
    );

    const renderRatingChart = (review: ReviewRecord) => {
        const chartKeys = ["overall" as const, ...ratingLabels.filter((key) => key !== "overall")];
        return (
            <div className="review-chart" aria-hidden="true">
                {chartKeys.map((key) => {
                    const value = review.ratings[key];
                    const width = Math.min(5, Math.abs(value)) / 5 * 100;
                    return (
                        <div className={`review-chart-row${key === "overall" ? " is-overall" : ""}${value < 0 ? " is-negative" : ""}`} key={key}>
                            <span className="review-chart-label">{ratingLabelText[key]}</span>
                            <div className="review-chart-track">
                                <div className={`review-chart-fill${value < 0 ? " is-negative" : ""}`} style={{ width: `${width}%` }} />
                            </div>
                            <span className="review-chart-value">{value.toFixed(1)}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderReviewCard = ({ map, review }: { map: MapRecord; review: ReviewRecord }) => (
        <section className="review-row panel review-row-feed" key={review.id}>
            <div className="review-map-info">
                <img className="review-cover" src={resolveMapImageUrl(map.coverImage)} alt={map.name} />
                <strong>{map.name}</strong>
                <div className="help review-map-author">{map.author}</div>
            </div>
            <div className="review-main">
                {renderRatingChart(review)}
                <div className="review-content">
                    <strong className="review-author">{review.anonymous ? "匿名" : review.reviewerName}</strong>
                    {review.comment ? <p className="hero-text review-comment-text">{review.comment}</p> : null}
                </div>
            </div>
            <time className="review-date" dateTime={review.submittedAt}>
                {formatDateTime(review.submittedAt)}
            </time>
        </section>
    );

    const renderReviewGroupItem = (review: ReviewRecord) => (
        <div className={`list-item review-group-item${review.ratings.overall < 0 ? " is-negative" : ""}`} key={review.id}>
            {renderRatingChart(review)}
            <div className="review-content">
                <div className="list-row">
                    <strong className="review-author">{review.anonymous ? "匿名" : review.reviewerName}</strong>
                    <time className="review-date-inline" dateTime={review.submittedAt}>
                        {formatDateTime(review.submittedAt)}
                    </time>
                </div>
                {review.comment ? <p className="hero-text review-comment-text">{review.comment}</p> : null}
            </div>
        </div>
    );

    const renderPagination = (items: Array<number | "gap">, current: number, total: number, goTo: (page: number) => void, label: string) => (
        <nav className="pagination" aria-label={label}>
            <button className="page-button page-arrow" type="button" disabled={current === 1} onClick={() => goTo(current - 1)}>
                上一页
            </button>
            <div className="page-numbers">
                {items.map((item, index) =>
                    item === "gap" ? (
                        <span className="page-gap" key={`gap-${index}`}>…</span>
                    ) : (
                        <button
                            className={`page-button${item === current ? " is-active" : ""}`}
                            type="button"
                            key={item}
                            onClick={() => goTo(item)}
                            aria-current={item === current ? "page" : undefined}
                        >
                            {item}
                        </button>
                    )
                )}
            </div>
            <button className="page-button page-arrow" type="button" disabled={current === total} onClick={() => goTo(current + 1)}>
                下一页
            </button>
        </nav>
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
                        <button
                            className={`overview-stat overview-stat-action${view === "maps" ? " is-active" : ""}`}
                            type="button"
                            onClick={() => setView("maps")}
                            aria-pressed={view === "maps"}
                        >
                            <strong>{mapCount}</strong>
                            <span>收录地图</span>
                        </button>
                        <button
                            className={`overview-stat overview-stat-action${view === "reviews" ? " is-active" : ""}`}
                            type="button"
                            onClick={() => setView("reviews")}
                            aria-pressed={view === "reviews"}
                        >
                            <strong>{reviewCount}</strong>
                            <span>玩家评价</span>
                        </button>
                        <div className="overview-stat">
                            <strong>{mapTypes.length}</strong>
                            <span>地图类型</span>
                        </div>
                    </div>
                    <p className="overview-updated">最近更新 · {updatedAt}</p>
                </div>

                {view === "maps" ? (
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
                ) : (
                    <div className="panel panel-pad panel-strong filter-panel">
                        <div className="filter-panel-head">
                            <p className="section-title filter-title">评价筛选</p>
                            <button
                                className={`page-button filter-reset${reviewSort === "newest" ? " filter-reset-idle" : ""}`}
                                type="button"
                                onClick={() => applyReviewSort("newest")}
                                disabled={reviewSort === "newest"}
                                aria-hidden={reviewSort === "newest"}
                            >
                                重置排序
                            </button>
                        </div>

                        <div className="overview-filter-block">
                            <p className="overview-group-title">时间顺序</p>
                            <div className="filter-chip-grid">
                                {renderFilterButton("review-newest", "新到旧", reviewSort === "newest", () => applyReviewSort("newest"))}
                                {renderFilterButton("review-oldest", "旧到新", reviewSort === "oldest", () => applyReviewSort("oldest"))}
                            </div>

                            <p className="overview-group-title">按地图</p>
                            <div className="filter-chip-grid">
                                {renderFilterButton("review-map", "按地图分组", reviewSort === "map", () => applyReviewSort("map"), reviewGroups.length)}
                            </div>

                            <p className="overview-group-title">分页</p>
                            <div className="filter-chip-grid">
                                {renderFilterButton("review-page-auto", "自动（按高度）", reviewPageMode === "auto", () => applyReviewPageMode("auto"))}
                                {renderFilterButton("review-page-5", reviewSort === "map" ? "5组" : "5条", reviewPageMode === 5, () => applyReviewPageMode(5))}
                                {renderFilterButton("review-page-10", reviewSort === "map" ? "10组" : "10条", reviewPageMode === 10, () => applyReviewPageMode(10))}
                                {renderFilterButton("review-page-20", reviewSort === "map" ? "20组" : "20条", reviewPageMode === 20, () => applyReviewPageMode(20))}
                            </div>
                        </div>

                        <div className="overview-filter-summary">
                            <span>当前排序 · {reviewSortLabels[reviewSort]}</span>
                            <span>共 {reviewEntries.length} 条评价</span>
                        </div>
                    </div>
                )}
            </section>

            {view === "maps" ? (
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

                    {totalPages > 1 ? renderPagination(pageItems, currentPage, totalPages, goToPage, "地图分页") : null}
                </section>
            ) : (
                <section className="panel panel-pad map-results-panel" id="review-results">
                    <div className="results-head">
                        <div>
                            <p className="eyebrow">REVIEWS</p>
                            <h2 className="section-title results-title">玩家评价</h2>
                        </div>
                    </div>

                    <div className="results-meta" aria-live="polite">
                        <span>{reviewSortLabels[reviewSort]}</span>
                        <span>共 {reviewEntries.length} 条评价 · 第 {currentReviewPage} / {reviewTotalPages} 页</span>
                    </div>

                    {reviewEntries.length === 0 ? (
                        <div className="empty-state">
                            <strong>还没有任何评价</strong>
                            <p>去地图详情页留下第一条评价吧。</p>
                            <button className="button button-primary button-rect" type="button" onClick={() => setView("maps")}>
                                返回地图广场
                            </button>
                        </div>
                    ) : reviewSort === "map" ? (
                        <div className="review-board" ref={reviewListRef}>
                            {pagedReviewGroups.map((group) => (
                                <section className="panel panel-pad review-group" key={group.map.id}>
                                    <div className="review-map-head">
                                        <img className="review-map-thumb" src={resolveMapImageUrl(group.map.coverImage)} alt={group.map.name} />
                                        <div>
                                            <strong>{group.map.name}</strong>
                                            <div className="help review-map-author">
                                                {group.map.author} · {group.reviews.length} 条评价
                                            </div>
                                        </div>
                                    </div>
                                    <div className="list">
                                        {group.reviews.map((review) => renderReviewGroupItem(review))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    ) : (
                        <div className="review-board" ref={reviewListRef}>
                            {pagedReviews.map((entry) => renderReviewCard(entry))}
                        </div>
                    )}

                    {reviewTotalPages > 1 ? renderPagination(reviewPageItems, currentReviewPage, reviewTotalPages, goToReviewPage, "评价分页") : null}
                </section>
            )}
        </>
    );
}
