"use client";

import type { EventRecord } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

export function HistoryList({ events }: { events: EventRecord[] }) {
    return (
        <div className="history">
            {events.map((event) => (
                <div className="history-item" key={event.id}>
                    <div>
                        <strong>{event.title}</strong>
                        <div><small>{event.detail ?? "历史记录"}</small></div>
                    </div>
                    <small>{formatDateTime(event.timestamp)}</small>
                </div>
            ))}
        </div>
    );
}
