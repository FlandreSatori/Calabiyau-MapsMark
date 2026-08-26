"use client";

import { useMemo, useState } from "react";

import { notify } from "@/components/toast";
import type { MapRecord, ReviewRecord } from "@/lib/types";

type ReviewEditorProps = {
    maps: MapRecord[];
    reviews: ReviewRecord[];
    token: string;
    onSaved: () => void;
};

export function ReviewEditor({ maps, reviews, token, onSaved }: ReviewEditorProps) {
    const [selectedId, setSelectedId] = useState(reviews[0]?.id ?? "");
    const [query, setQuery] = useState("");
    const [comment, setComment] = useState("");
    const [saving, setSaving] = useState(false);
    const mapNames = useMemo(() => new Map(maps.map((map) => [map.id, map.name])), [maps]);
    const visibleReviews = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return reviews;
        return reviews.filter((review) => [review.reviewerName, review.comment, mapNames.get(review.mapId) ?? ""].some((value) => value.toLowerCase().includes(normalized)));
    }, [mapNames, query, reviews]);
    const selected = reviews.find((review) => review.id === selectedId) ?? visibleReviews[0] ?? reviews[0];
    const draftComment = selected?.id === selectedId && comment !== "" ? comment : selected?.comment ?? "";

    const selectReview = (review: ReviewRecord) => {
        setSelectedId(review.id);
        setComment(review.comment);
    };

    const mutate = async (method: "PATCH" | "DELETE") => {
        if (!selected) return;
        setSaving(true);
        try {
            const response = await fetch("/api/state", {
                method,
                headers: { "Content-Type": "application/json", "x-admin-token": token },
                body: JSON.stringify({ type: "review", id: selected.id, patch: method === "PATCH" ? { comment: draftComment } : undefined })
            });
            if (!response.ok) throw new Error((await response.text()) || "操作失败");
            notify("success", method === "PATCH" ? "评价已保存" : "评价已删除", mapNames.get(selected.mapId) ?? selected.mapId);
            setComment("");
            setSelectedId("");
            onSaved();
        } catch (error) {
            notify("error", "评价操作失败", error instanceof Error ? error.message : "请稍后再试");
        } finally {
            setSaving(false);
        }
    };

    if (!reviews.length) return <p className="help">暂无评价。</p>;

    return (
        <div className="admin-workspace">
            <aside className="admin-record-list">
                <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索评价、地图或评价人" aria-label="搜索评价" />
                <div className="admin-record-scroll">
                    {visibleReviews.map((review) => (
                        <button className={`admin-record-button${selected?.id === review.id ? " is-active" : ""}`} type="button" key={review.id} onClick={() => selectReview(review)}>
                            <span><strong>{mapNames.get(review.mapId) ?? review.mapId}</strong><small>{review.anonymous ? "匿名" : review.reviewerName} · {review.ratings.overall.toFixed(1)} 分</small></span>
                        </button>
                    ))}
                </div>
            </aside>
            {selected ? <div className="list-item admin-record-detail">
                <div className="list-row">
                    <div><strong>{mapNames.get(selected.mapId) ?? selected.mapId}</strong><div className="help">{selected.anonymous ? "匿名" : selected.reviewerName}</div></div>
                    <span className="badge">{selected.ratings.overall.toFixed(1)} 分</span>
                </div>
                <label className="label full">评价内容<textarea className="textarea" value={draftComment} onChange={(event) => { setSelectedId(selected.id); setComment(event.target.value); }} /></label>
                <div className="admin-map-actions">
                    <button className="button button-primary" type="button" disabled={saving || draftComment === selected.comment} onClick={() => void mutate("PATCH")}>保存评价</button>
                    <button className="button button-danger" type="button" disabled={saving} onClick={() => void mutate("DELETE")}>删除评价</button>
                </div>
            </div> : null}
        </div>
    );
}
