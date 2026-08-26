"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { MapForm } from "@/components/forms";
import { MapEditor } from "@/components/map-editor";
import { ReviewEditor } from "@/components/review-editor";
import { notify } from "@/components/toast";
import type { MapRecord, ReviewRecord } from "@/lib/types";

type AdminView = "add" | "maps" | "reviews";
type HomeAdminWorkspaceProps = {
    maps: MapRecord[];
    reviews: ReviewRecord[];
    mapTypes: string[];
};

const storageKey = "mapsmark-admin-token";

export function HomeAdminWorkspace({ maps, reviews, mapTypes }: HomeAdminWorkspaceProps) {
    const router = useRouter();
    const [tokenInput, setTokenInput] = useState("");
    const [token, setToken] = useState("");
    const [checking, setChecking] = useState(false);
    const [view, setView] = useState<AdminView>("add");

    const verify = async (candidate: string, quiet = false) => {
        if (!candidate) return;
        setChecking(true);
        try {
            const response = await fetch("/api/auth/admin", { method: "POST", headers: { "x-admin-token": candidate } });
            if (!response.ok) throw new Error("管理员令牌无效");
            setToken(candidate);
            setTokenInput(candidate);
            window.localStorage.setItem(storageKey, candidate);
            if (!quiet) notify("success", "管理员模式已启用", "现在可以直接管理主页数据。");
        } catch (error) {
            setToken("");
            window.localStorage.removeItem(storageKey);
            if (!quiet) notify("error", "验证失败", error instanceof Error ? error.message : "管理员令牌无效");
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        const saved = window.localStorage.getItem(storageKey) ?? "";
        setTokenInput(saved);
        if (saved) void verify(saved, true);
    }, []);

    const logout = () => {
        setToken("");
        setTokenInput("");
        window.localStorage.removeItem(storageKey);
        notify("success", "已退出管理员模式", "主页恢复为公开浏览模式。");
    };

    return (
        <section className="panel panel-pad home-admin" id="manage">
            <div className="home-admin-heading">
                <div><p className="section-title">管理工作台</p><h2>{token ? "直接编辑主页数据" : "管理员验证"}</h2></div>
                {token ? <button className="button" type="button" onClick={logout}>退出管理</button> : null}
            </div>
            {!token ? <div className="admin-login-inline">
                <label className="label">管理员令牌<input className="input" type="password" value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void verify(tokenInput); }} placeholder="输入 ADMIN_TOKEN" /></label>
                <button className="button button-primary" type="button" disabled={checking || !tokenInput} onClick={() => void verify(tokenInput)}>{checking ? "验证中..." : "验证并进入"}</button>
            </div> : <>
                <div className="admin-tabs" role="tablist" aria-label="管理数据">
                    <button className={view === "add" ? "is-active" : ""} type="button" onClick={() => setView("add")}>添加地图</button>
                    <button className={view === "maps" ? "is-active" : ""} type="button" onClick={() => setView("maps")}>地图 {maps.length}</button>
                    <button className={view === "reviews" ? "is-active" : ""} type="button" onClick={() => setView("reviews")}>评价 {reviews.length}</button>
                </div>
                <div className="admin-tab-panel">
                    {view === "add" ? <MapForm mapTypes={mapTypes} adminToken={token} onSuccess={() => router.refresh()} /> : null}
                    {view === "maps" ? <MapEditor maps={maps} token={token} onSaved={() => router.refresh()} /> : null}
                    {view === "reviews" ? <ReviewEditor maps={maps} reviews={reviews} token={token} onSaved={() => router.refresh()} /> : null}
                </div>
            </>}
        </section>
    );
}
