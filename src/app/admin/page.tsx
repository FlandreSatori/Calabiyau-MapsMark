"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminLogin } from "@/components/forms";
import { HistoryList } from "@/components/history-list";
import { MetricDashboard } from "@/components/metric-dashboard";
import type { AppState } from "@/lib/types";
import { summarizeState } from "@/lib/state-utils";

const emptyState: AppState = { maps: [], reviews: [], events: [], updatedAt: new Date().toISOString() };

export default function AdminPage({ searchParams }: { searchParams?: { bg?: string } }) {
    const [token, setToken] = useState("");
    const [state, setState] = useState<AppState>(emptyState);
    const [ready, setReady] = useState(false);
    const background = searchParams?.bg;

    useEffect(() => {
        setToken(localStorage.getItem("mapsmark-admin-token") ?? "");
        setReady(true);
    }, []);

    useEffect(() => {
        if (!token) return;
        localStorage.setItem("mapsmark-admin-token", token);
        void refresh();
    }, [token]);

    const summary = useMemo(() => summarizeState(state), [state]);

    const refresh = async () => {
        const response = await fetch("/api/state", { cache: "no-store" });
        if (response.ok) {
            setState((await response.json()) as AppState);
        }
    };

    const mutate = async (method: "PATCH" | "DELETE", type: "map" | "review", id: string, patch?: unknown) => {
        const response = await fetch("/api/state", {
            method,
            headers: {
                "Content-Type": "application/json",
                "x-admin-token": token
            },
            body: JSON.stringify({ type, id, patch })
        });
        if (response.ok) {
            await refresh();
        }
    };

    if (!ready) {
        return null;
    }

    return (
        <main className="app-shell" style={background ? { background } : undefined}>
            <div className="container grid gap-18">
                <section className="panel panel-pad">
                    <p className="section-title">Admin</p>
                    <h1 className="hero-title" style={{ fontSize: "2.4rem" }}>后台管理</h1>
                    <p className="hero-text">输入管理员令牌后，可以修改或删除地图、评价与历史记录。</p>
                    <AdminLogin currentToken={token} onLogin={setToken} />
                </section>

                <section className="grid grid-hero">
                    <div className="panel panel-pad">
                        <p className="section-title">数据概览</p>
                        <div className="legend-grid">
                            <div className="legend-row"><span>地图</span><strong>{summary.mapCount}</strong></div>
                            <div className="legend-row"><span>评价</span><strong>{summary.reviewCount}</strong></div>
                            <div className="legend-row"><span>最近更新时间</span><strong>{state.updatedAt.slice(0, 19).replace("T", " ")}</strong></div>
                        </div>
                        <MetricDashboard values={summary.averages} />
                    </div>
                    <div className="panel panel-pad">
                        <p className="section-title">历史记录</p>
                        <HistoryList events={summary.events} />
                    </div>
                </section>

                <section className="panel panel-pad">
                    <p className="section-title">地图管理</p>
                    <div className="admin-grid">
                        {summary.maps.map((map) => (
                            <div className="list-item" key={map.id}>
                                <div className="list-row">
                                    <strong>{map.name}</strong>
                                    <span className="badge">{map.type}</span>
                                </div>
                                <div className="stat-strip">
                                    <span className="stat">{map.author}</span>
                                    <span className="stat">{map.code}</span>
                                </div>
                                <textarea
                                    className="textarea"
                                    defaultValue={map.introduction}
                                    onBlur={(event) => mutate("PATCH", "map", map.id, { introduction: event.target.value })}
                                />
                                <div className="toolbar">
                                    <button className="button button-danger" onClick={() => mutate("DELETE", "map", map.id)} type="button">删除地图</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="panel panel-pad">
                    <p className="section-title">评价管理</p>
                    <div className="admin-grid">
                        {summary.reviews.map((review) => (
                            <div className="list-item" key={review.id}>
                                <div className="list-row">
                                    <strong>{review.anonymous ? "匿名" : review.reviewerName}</strong>
                                    <span className="badge">{review.mapId}</span>
                                </div>
                                <textarea
                                    className="textarea"
                                    defaultValue={review.comment}
                                    onBlur={(event) => mutate("PATCH", "review", review.id, { comment: event.target.value })}
                                />
                                <div className="toolbar">
                                    <button className="button button-danger" onClick={() => mutate("DELETE", "review", review.id)} type="button">删除评价</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
