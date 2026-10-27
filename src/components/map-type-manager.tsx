"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { notify } from "@/components/toast";

type MapTypeManagerProps = {
    mapTypes: string[];
    typeCounts: Record<string, number>;
    token: string;
    onSuccess?: () => void;
};

export function MapTypeManager({ mapTypes, typeCounts, token, onSuccess }: MapTypeManagerProps) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            notify("info", "请输入类型名称", "例如：解谜、建筑、剧情。");
            return;
        }
        setSaving(true);
        try {
            const response = await fetch("/api/state", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-admin-token": token },
                body: JSON.stringify({ type: "mapType", payload: { name: trimmed } })
            });
            if (!response.ok) {
                const text = await response.text();
                let message = "添加失败";
                try {
                    message = JSON.parse(text)?.message ?? message;
                } catch {
                    message = text || message;
                }
                throw new Error(message);
            }
            notify("success", "地图类型已添加", `“${trimmed}”已可用于新地图与首页筛选。`);
            setName("");
            router.refresh();
            onSuccess?.();
        } catch (error) {
            notify("error", "添加失败", error instanceof Error ? error.message : "请稍后再试");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="type-manager">
            <p className="help type-manager-hint">新增类型会立即出现在「添加地图」的类型下拉框与首页筛选中。</p>
            <form className="type-manager-form" onSubmit={handleSubmit}>
                <input
                    className="input"
                    value={name}
                    maxLength={20}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="输入新类型，例如：解谜"
                    aria-label="新地图类型名称"
                />
                <button className="button button-primary button-rect" type="submit" disabled={saving || !name.trim()}>
                    {saving ? "添加中..." : "添加类型"}
                </button>
            </form>
            <div>
                <p className="overview-group-title type-manager-title">现有类型</p>
                <div className="type-chip-list">
                    {mapTypes.map((type) => (
                        <span className="type-chip" key={type}>
                            {type}
                            <strong>{typeCounts[type] ?? 0}</strong>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
