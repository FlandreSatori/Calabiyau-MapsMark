"use client";

import Link from "next/link";

import type { EventRecord, MapRecord } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

type HistoryListProps = {
    events: EventRecord[];
    maps?: MapRecord[];
};

const eventKindLabel: Record<EventRecord["kind"], string> = {
    "map-create": "地图新增",
    "map-update": "地图更新",
    "map-delete": "地图删除",
    "review-create": "评价新增",
    "review-update": "评价更新",
    "review-delete": "评价删除"
};

export function HistoryList({ events, maps = [] }: HistoryListProps) {
    const mapNameById = new Map(maps.map((map) => [map.id, map.name]));

    return (
        <div className="history history-scroll" role="log" aria-live="polite">
            {events.map((event) => {
                const isReviewCreate = event.kind === "review-create";
                const mapName = isReviewCreate ? mapNameById.get(event.detail ?? "") : undefined;

                return (
                    <div className="history-item" key={event.id}>
                        <div>
                            <div className="history-head">
                                <strong>{event.title}</strong>
                                <span className="history-kind">{eventKindLabel[event.kind]}</span>
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
