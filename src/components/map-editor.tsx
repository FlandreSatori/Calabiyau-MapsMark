"use client";

import { useEffect, useState } from "react";

import { notify } from "@/components/toast";
import type { MapInput, MapRecord } from "@/lib/types";

type MapDraft = Pick<
    MapInput,
    "coverImage" | "customCoverImage" | "previewImage" | "customPreviewImage" | "code" | "type" | "name" | "author" | "mappedAt" | "introduction" | "estimatedMinutes"
>;

type MapEditorProps = {
    maps: MapRecord[];
    token: string;
    onSaved?: () => void;
};

const createDraft = (map: MapRecord): MapDraft => ({
    coverImage: map.coverImage,
    customCoverImage: map.customCoverImage ?? "",
    previewImage: map.previewImage,
    customPreviewImage: map.customPreviewImage ?? "",
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

    useEffect(() => {
        setDrafts((current) => {
            const next: Record<string, MapDraft> = {};
            maps.forEach((map) => {
                next[map.id] = current[map.id] ?? createDraft(map);
            });
            return next;
        });
    }, [maps]);

    const updateDraft = (mapId: string, patch: Partial<MapDraft>) => {
        setDrafts((current) => ({
            ...current,
            [mapId]: {
                ...(current[mapId] ?? createDraft(maps.find((map) => map.id === mapId) ?? maps[0])),
                ...patch
            }
        }));
    };

    const saveMap = async (map: MapRecord) => {
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
            onSaved?.();
        } catch (error) {
            const message = error instanceof Error ? error.message : "请稍后再试";
            notify("error", "保存失败", message);
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="admin-grid">
            {maps.map((map) => {
                const draft = drafts[map.id] ?? createDraft(map);
                return (
                    <div className="list-item admin-map-editor" key={map.id}>
                        <div className="list-row">
                            <strong>{map.name}</strong>
                            <span className="badge">{map.type}</span>
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
                                封面自定义图床链接
                                <input className="input" value={draft.customCoverImage ?? ""} placeholder="留空则使用 GitHub 直链/加速链" onChange={(event) => updateDraft(map.id, { customCoverImage: event.target.value })} />
                            </label>
                            <label className="label full">
                                预览图地址
                                <input className="input" value={draft.previewImage} onChange={(event) => updateDraft(map.id, { previewImage: event.target.value })} />
                            </label>
                            <label className="label full">
                                预览图自定义图床链接
                                <input className="input" value={draft.customPreviewImage ?? ""} placeholder="留空则使用 GitHub 直链/加速链" onChange={(event) => updateDraft(map.id, { customPreviewImage: event.target.value })} />
                            </label>
                            <label className="label full">
                                地图介绍
                                <textarea className="textarea" value={draft.introduction} onChange={(event) => updateDraft(map.id, { introduction: event.target.value })} />
                            </label>
                        </div>
                        <div className="admin-map-actions">
                            <button className="button button-primary" type="button" onClick={() => void saveMap(map)} disabled={savingId === map.id}>
                                {savingId === map.id ? "保存中..." : "保存修改"}
                            </button>
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
                    </div>
                );
            })}
        </div>
    );
}