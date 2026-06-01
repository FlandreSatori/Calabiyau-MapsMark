"use client";

import Link from "next/link";

import type { EventRecord, MapRecord } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

type HistoryListProps = {
    events: EventRecord[];
    maps?: MapRecord[];
};

export function HistoryList({ events, maps = [] }: HistoryListProps) {
    const mapNameById = new Map(maps.map((map) => [map.id, map.name]));

    return (
        <div className="history">
            {events.map((event) => {
                const isReviewCreate = event.kind === "review-create";
                const mapName = isReviewCreate ? mapNameById.get(event.detail ?? "") : undefined;

                return (
                    <div className="history-item" key={event.id}>
                        <div>
                            <strong>{event.title}</strong>
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
