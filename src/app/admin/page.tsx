"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminLogin } from "@/components/forms";
import { CopyButton } from "@/components/copy-button";
import { HistoryList } from "@/components/history-list";
import { MapEditor } from "@/components/map-editor";
import { notify } from "@/components/toast";
import type { AppState } from "@/lib/types";
import { summarizeState } from "@/lib/state-utils";

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
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadedImageUrl, setUploadedImageUrl] = useState("");
    const [uploadError, setUploadError] = useState("");

    const uploadImage = async (file: File | null) => {
        if (!file) return;
        setUploadingImage(true);
        setUploadError("");
        try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result ?? ""));
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(file);
            });
            const base64 = dataUrl.split(",")[1] ?? "";
            const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
            const response = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename, contentBase64: base64, contentType: file.type || "application/octet-stream" })
            });
            const textBody = await response.text();
            const payload = textBody ? JSON.parse(textBody) : {};
            if (!response.ok) {
                throw new Error(payload?.message ?? textBody ?? "上传失败");
            }
            setUploadedImageUrl(payload.url ?? "");
            notify("success", "上传成功", "图片已上传，请复制链接替换地图封面。");
        } catch (error) {
            const message = error instanceof Error ? error.message : "上传失败";
            setUploadError(message);
            notify("error", "上传失败", message);
        } finally {
            setUploadingImage(false);
        }
    };

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
                        <p className="section-title">上传图片</p>
                        <p className="help">返回图片链接地址</p>
                        <label className="label full">
                            上传封面图
                            <input
                                className="input"
                                type="file"
                                accept="image/*"
                                disabled={uploadingImage}
                                onChange={(event) => void uploadImage(event.target.files?.[0] ?? null)}
                            />
                        </label>
                        {uploadError ? <p className="help" style={{ color: "#ffb1bb", marginTop: 8 }}>{uploadError}</p> : null}
                        {uploadedImageUrl ? (
                            <div className="help" style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                <span>图片链接：</span>
                                <code style={{ wordBreak: "break-all", background: "rgba(255,255,255,0.04)", padding: "6px 10px", borderRadius: 8 }}>{uploadedImageUrl}</code>
                                <CopyButton value={uploadedImageUrl} label="复制链接" successMessage="图片链接已复制。" />
                            </div>
                        ) : null}
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
