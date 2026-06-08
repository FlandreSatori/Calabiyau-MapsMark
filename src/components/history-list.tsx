"use client";

import Link from "next/link";

import type { EventRecord, MapRecord, ReviewRecord } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

type HistoryListProps = {
    events: EventRecord[];
    maps?: MapRecord[];
    reviews?: ReviewRecord[];
    mode?: "single" | "split";
};

export function HistoryList({ events, maps = [], reviews = [], mode = "single" }: HistoryListProps) {
    const mapNameById = new Map(maps.map((map) => [map.id, map.name]));
    const mapById = new Map(maps.map((map) => [map.id, map]));
    const reviewById = new Map(reviews.map((review) => [review.id, review]));
    const mapCreateEvents = events.filter((event) => event.kind === "map-create");
    const reviewCreateEvents = events.filter((event) => event.kind === "review-create");

    if (mode === "single") {
        return (
            <div className="history history-scroll" role="log" aria-live="polite">
                {events.map((event) => {
                    const isReviewCreate = event.kind === "review-create";
                    const mapName = isReviewCreate ? mapNameById.get(event.detail ?? "") : undefined;
                    const isReviewEvent = event.kind.startsWith("review");
                    const review = reviewById.get(event.subjectId);
                    const map = mapById.get(event.subjectId);
                    const singleTag = isReviewEvent
                        ? (typeof review?.ratings.overall === "number" ? `${review.ratings.overall.toFixed(1)} 分` : "无评分")
                        : (map?.type ?? "未知类型");

                    return (
                        <div className="history-item" key={event.id}>
                            <div>
                                <div className="history-head">
                                    <strong>{event.title}</strong>
                                    <span className="history-kind">{singleTag}</span>
                                </div>
                                <div>
                                    <small>
                                        {isReviewCreate && event.detail ? (
                                            <>
                                                {"地图："}
                                                <Link href={`/maps/${event.detail}`}>{mapName ?? event.detail}</Link>
                                            </>
                                        ) : (
                                            event.detail ?? "历史记录"
                                        )}
                                    </small>
                                </div>
                            </div>
                            <small>{formatDateTime(event.timestamp)}</small>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="history-columns" role="log" aria-live="polite">
            <div className="history-pane">
                <p className="section-title">新增地图</p>
                <div className="history history-scroll">
                    {mapCreateEvents.map((event) => {
                        const map = mapById.get(event.subjectId);

                        return (
                            <div className="history-item" key={event.id}>
                                <div>
                                    <div className="history-head">
                                        <strong>{event.title}</strong>
                                        <span className="history-kind">{map?.type ?? "未知类型"}</span>
                                    </div>
                                    <div>
                                        <small>{map?.code ?? event.detail ?? "历史记录"}</small>
                                    </div>
                                </div>
                                <small>{formatDateTime(event.timestamp)}</small>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="history-pane">
                <p className="section-title">新增评价</p>
                <div className="history history-scroll">
                    {reviewCreateEvents.map((event) => {
                        const review = reviewById.get(event.subjectId);
                        const mapId = review?.mapId ?? event.detail;
                        const mapName = mapId ? mapNameById.get(mapId) : undefined;
                        const overall = review?.ratings.overall;

                        return (
                            <div className="history-item" key={event.id}>
                                <div>
                                    <div className="history-head">
                                        <strong>{event.title}</strong>
                                        <span className="history-kind">
                                            {typeof overall === "number" ? `${overall.toFixed(1)} 分` : "无评分"}
                                        </span>
                                    </div>
                                    <div>
                                        <small>
                                            {mapId ? (
                                                <>
                                                    {"地图："}
                                                    <Link href={`/maps/${mapId}`}>{mapName ?? mapId}</Link>
                                                </>
                                            ) : (
                                                "历史记录"
                                            )}
                                        </small>
                                    </div>
                                </div>
                                <small>{formatDateTime(event.timestamp)}</small>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
