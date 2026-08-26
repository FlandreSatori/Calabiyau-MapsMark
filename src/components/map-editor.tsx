"use client";

import { useEffect, useMemo, useState } from "react";

import { notify } from "@/components/toast";
import type { MapInput, MapRecord } from "@/lib/types";

type MapDraft = Pick<
    MapInput,
    "coverImage" | "previewImage" | "code" | "type" | "name" | "author" | "mappedAt" | "introduction" | "estimatedMinutes"
>;

type MapEditorProps = {
    maps: MapRecord[];
    token: string;
    onSaved?: () => void;
};

const createDraft = (map: MapRecord): MapDraft => ({
    coverImage: map.coverImage,
    previewImage: map.previewImage,
    code: map.code,
    type: map.type,
    name: map.name,
    author: map.author,
    mappedAt: map.mappedAt,
    introduction: map.introduction,
    estimatedMinutes: map.estimatedMinutes
});

export function MapEditor({ maps, token, onSaved }: MapEditorProps) {
    const [drafts, setDrafts] = useState<Record<string, MapDraft>>({});
    const [savingId, setSavingId] = useState<string | null>(null);
    const [savingAll, setSavingAll] = useState(false);
    const [draftReady, setDraftReady] = useState(false);
    const [selectedId, setSelectedId] = useState(maps[0]?.id ?? "");
    const [query, setQuery] = useState("");

    const draftStorageKey = "mapsmark-map-drafts";

    useEffect(() => {
        const stored = window.localStorage.getItem(draftStorageKey);
        const storedDrafts = stored ? (JSON.parse(stored) as Record<string, MapDraft>) : {};
        setDrafts((current) => {
            const next: Record<string, MapDraft> = {};
            maps.forEach((map) => {
                next[map.id] = current[map.id] ?? storedDrafts[map.id] ?? createDraft(map);
            });
            return next;
        });
        setDraftReady(true);
    }, [maps]);

    useEffect(() => {
        if (draftReady) {
            window.localStorage.setItem(draftStorageKey, JSON.stringify(drafts));
        }
    }, [draftReady, drafts]);

    const dirtyIds = useMemo(() => maps.filter((map) => JSON.stringify(drafts[map.id]) !== JSON.stringify(createDraft(map))).map((map) => map.id), [drafts, maps]);
    const visibleMaps = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return maps;
        return maps.filter((map) => [map.name, map.author, map.code, map.type].some((value) => value.toLowerCase().includes(normalized)));
    }, [maps, query]);
    const selectedMap = maps.find((map) => map.id === selectedId) ?? visibleMaps[0] ?? maps[0];

    const updateDraft = (mapId: string, patch: Partial<MapDraft>) => {
        setDrafts((current) => ({
            ...current,
            [mapId]: {
                ...(current[mapId] ?? createDraft(maps.find((map) => map.id === mapId) ?? maps[0])),
                ...patch
            }
        }));
    };

    const saveMap = async (map: MapRecord, shouldRefresh = true) => {
        const patch = drafts[map.id] ?? createDraft(map);
        setSavingId(map.id);
        try {
            const response = await fetch("/api/state", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-token": token
                },
                body: JSON.stringify({ type: "map", id: map.id, patch })
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "保存地图失败");
            }
            notify("success", "地图已保存", `${patch.name || map.name} 的详情已更新。`);
            if (shouldRefresh) {
                window.localStorage.removeItem(draftStorageKey);
                onSaved?.();
            }
            return true;
        } catch (error) {
            const message = error instanceof Error ? error.message : "请稍后再试";
            notify("error", "保存失败", message);
            return false;
        } finally {
            setSavingId(null);
        }
    };

    const saveAll = async () => {
        setSavingAll(true);
        const dirtyMaps = maps.filter((map) => dirtyIds.includes(map.id));
        let allSaved = true;
        for (const map of dirtyMaps) {
            allSaved = (await saveMap(map, false)) && allSaved;
        }
        setSavingAll(false);
        if (allSaved && dirtyMaps.length > 0) {
            window.localStorage.removeItem(draftStorageKey);
            notify("success", "草稿已全部提交", `已更新 ${dirtyMaps.length} 张地图。`);
            onSaved?.();
        }
    };

    return (
        <div className="admin-editor-shell">
            <div className="editor-toolbar">
                <div>
                    <strong>地图草稿</strong>
                    <span className="help">{dirtyIds.length ? `${dirtyIds.length} 项未提交，草稿已保存在本机` : "所有修改都会先保存在本机"}</span>
                </div>
                <div className="toolbar">
                    <button className="button button-primary" type="button" onClick={() => void saveAll()} disabled={savingAll || dirtyIds.length === 0}>
                        {savingAll ? "提交中..." : `提交全部${dirtyIds.length ? ` (${dirtyIds.length})` : ""}`}
                    </button>
                </div>
            </div>
            {maps.length ? <div className="admin-workspace">
                <aside className="admin-record-list">
                    <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索地图、作者或代码" aria-label="搜索地图" />
                    <div className="admin-record-scroll">
                        {visibleMaps.map((map) => (
                            <button className={`admin-record-button${selectedMap?.id === map.id ? " is-active" : ""}`} type="button" key={map.id} onClick={() => setSelectedId(map.id)}>
                                <span><strong>{map.name}</strong><small>{map.author} · {map.code}</small></span>
                                {dirtyIds.includes(map.id) ? <span className="badge badge-dirty">草稿</span> : null}
                            </button>
                        ))}
                    </div>
                </aside>
                {selectedMap ? (() => {
                    const map = selectedMap;
                    const draft = drafts[map.id] ?? createDraft(map);
                    const isDirty = dirtyIds.includes(map.id);
                    return <div className="list-item admin-map-editor admin-record-detail">
                        <div className="list-row">
                            <strong>{map.name}</strong>
                            <span className={`badge ${isDirty ? "badge-dirty" : ""}`}>{isDirty ? "草稿" : map.type}</span>
                        </div>
                        <div className="admin-map-fields">
                            <label className="label">
                                地图名
                                <input className="input" value={draft.name} onChange={(event) => updateDraft(map.id, { name: event.target.value })} />
                            </label>
                            <label className="label">
                                地图代码
                                <input className="input" value={draft.code} onChange={(event) => updateDraft(map.id, { code: event.target.value })} />
                            </label>
                            <label className="label">
                                地图类型
                                <input className="input" value={draft.type} onChange={(event) => updateDraft(map.id, { type: event.target.value })} />
                            </label>
                            <label className="label">
                                作者
                                <input className="input" value={draft.author} onChange={(event) => updateDraft(map.id, { author: event.target.value })} />
                            </label>
                            <label className="label">
                                制图时间
                                <input className="input" type="date" value={draft.mappedAt ? draft.mappedAt.slice(0, 10) : ""} onChange={(event) => updateDraft(map.id, { mappedAt: event.target.value })} />
                            </label>
                            <label className="label">
                                预计游玩时间（分钟）
                                <input className="input" type="number" min="1" max="9999" value={draft.estimatedMinutes} onChange={(event) => updateDraft(map.id, { estimatedMinutes: Number(event.target.value) })} />
                            </label>
                            <label className="label full">
                                封面地址
                                <input className="input" value={draft.coverImage} onChange={(event) => updateDraft(map.id, { coverImage: event.target.value })} />
                            </label>
                            <label className="label full">
                                预览图地址
                                <input className="input" value={draft.previewImage} onChange={(event) => updateDraft(map.id, { previewImage: event.target.value })} />
                            </label>
                            <label className="label full">
                                地图介绍
                                <textarea className="textarea" value={draft.introduction} onChange={(event) => updateDraft(map.id, { introduction: event.target.value })} />
                            </label>
                        </div>
                        <div className="admin-map-actions">
                            <button className="button button-primary" type="button" onClick={() => void saveMap(map)} disabled={savingId === map.id || savingAll || !isDirty}>
                                {savingId === map.id ? "保存中..." : "保存修改"}
                            </button>
                            <button className="button" type="button" onClick={() => updateDraft(map.id, createDraft(map))} disabled={!isDirty || savingAll}>撤销草稿</button>
                            <button className="button button-danger" type="button" onClick={() => void fetch("/api/state", {
                                method: "DELETE",
                                headers: {
                                    "Content-Type": "application/json",
                                    "x-admin-token": token
                                },
                                body: JSON.stringify({ type: "map", id: map.id })
                            }).then(async (response) => {
                                if (!response.ok) {
                                    const text = await response.text();
                                    throw new Error(text || "删除地图失败");
                                }
                                notify("success", "已删除地图", "操作已提交并刷新。");
                                onSaved?.();
                            }).catch((error: unknown) => {
                                const message = error instanceof Error ? error.message : "请稍后再试";
                                notify("error", "删除失败", message);
                            })}>
                                删除地图
                            </button>
                        </div>
                    </div>;
                })() : null}
            </div> : <p className="help">暂无地图。</p>}
        </div>
    );
}