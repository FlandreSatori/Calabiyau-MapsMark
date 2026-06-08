"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminLogin } from "@/components/forms";
import { HistoryList } from "@/components/history-list";
import { MapEditor } from "@/components/map-editor";
import { MetricDashboard } from "@/components/metric-dashboard";
import { notify } from "@/components/toast";
import type { AppState } from "@/lib/types";
import { summarizeState } from "@/lib/state-utils";
import { formatDateTime } from "@/lib/format";

const emptyState: AppState = { maps: [], reviews: [], events: [], updatedAt: new Date().toISOString() };

export default function AdminPage() {
    const [token, setToken] = useState("");
    const [state, setState] = useState<AppState>(emptyState);
    const [ready, setReady] = useState(false);
    const [background, setBackground] = useState("");

    useEffect(() => {
        setToken(localStorage.getItem("mapsmark-admin-token") ?? "");
        const params = new URLSearchParams(window.location.search);
        setBackground(params.get("bg") ?? "");
        setReady(true);
    }, []);

    useEffect(() => {
        if (!token) return;
        localStorage.setItem("mapsmark-admin-token", token);
        notify("success", "管理员令牌已保存", "已保存到本地并用于后续操作。");
        void refresh();
    }, [token]);

    const summary = useMemo(() => summarizeState(state), [state]);
    const [bgInput, setBgInput] = useState("");

    const refresh = async () => {
        const response = await fetch("/api/state", { cache: "no-store" });
        if (response.ok) {
            const s = (await response.json()) as AppState;
            setState(s);
            setBgInput(s.ui?.background ?? "");
        }
    };

    const mutate = async (method: "PATCH" | "DELETE", type: "map" | "review" | "ui", id: string, patch?: unknown) => {
        const response = await fetch("/api/state", {
            method,
            headers: {
                "Content-Type": "application/json",
                "x-admin-token": token
            },
            body: JSON.stringify({ type, id, patch })
        });
        if (response.ok) {
            // 乐观更新：先在本地移除或修改对应项，以便 UI 立即反映
            setState((prev) => {
                const next = structuredClone(prev);
                if (type === "map") {
                    next.maps = next.maps.map((m) => (m.id === id ? { ...m, deletedAt: new Date().toISOString() } : m));
                } else {
                    next.reviews = next.reviews.map((r) => (r.id === id ? { ...r, deletedAt: new Date().toISOString() } : r));
                }
                return next;
            });
            // 然后刷新以确保与服务器保持一致
            await refresh();
            // success notification
            if (method === "DELETE") {
                notify("success", type === "map" ? "已删除地图" : "已删除评价", "操作已提交并刷新。");
            } else if (method === "PATCH" && type === "ui") {
                notify("success", "已保存背景", "UI 背景已更新。");
            } else {
                notify("success", "已保存更改", "操作成功并已刷新。");
            }
        } else {
            const textBody = await response.text();
            let text = textBody;
            try {
                const parsed = JSON.parse(textBody);
                text = JSON.stringify(parsed);
            } catch (e) {
                // leave text as-is
            }
            // show error toast and log
            notify("error", `Server error (${response.status})`, text);
            // eslint-disable-next-line no-console
            console.error("API /api/state error:", response.status, text);
        }
    };

    const saveBackground = async () => {
        await mutate("PATCH", "ui", "ui", { background: bgInput });
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
                            <div className="legend-row"><span>最近更新时间</span><strong>{formatDateTime(state.updatedAt)}</strong></div>
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <label className="label">自定义背景（CSS，可填颜色/渐变/rgba）：</label>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                                <input className="input" value={bgInput} onChange={(e) => setBgInput(e.target.value)} placeholder="e.g. rgba(8,12,22,0.6) or linear-gradient(...)" />
                                <button className="button button-primary" onClick={saveBackground} type="button">保存背景</button>
                            </div>
                            <div style={{ marginTop: 10 }}>
                                <div style={{ height: 80, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: bgInput || "transparent" }} />
                            </div>
                        </div>
                        <MetricDashboard maps={summary.maps} reviews={summary.reviews} />
                    </div>
                    <div className="panel panel-pad">
                        <p className="section-title">历史记录</p>
                        <HistoryList events={summary.events} />
                    </div>
                </section>

                <section className="panel panel-pad">
                    <p className="section-title">地图管理</p>
                    <MapEditor maps={summary.maps} token={token} onSaved={refresh} />
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
