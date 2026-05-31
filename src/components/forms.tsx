"use client";

import { useMemo, useState, type FormEvent } from "react";

import type { MapRecord, RatingDimensions, ReviewRecord } from "@/lib/types";
import { clampScore } from "@/lib/format";
import { ratingLabelText } from "@/lib/types";

type ToastState = { title: string; message: string } | null;

type MapFormProps = {
    mapTypes: string[];
    onSuccess?: () => void;
    notify?: (toast: ToastState) => void;
};

type ReviewFormProps = {
    maps: MapRecord[];
    onSuccess?: () => void;
    notify?: (toast: ToastState) => void;
};

type AdminLoginProps = {
    onLogin: (token: string) => void;
    currentToken: string;
};

const ratingKeys = Object.keys(ratingLabelText) as Array<keyof RatingDimensions>;

const readFileAsDataUrl = async (file: File | null) => {
    if (!file) {
        return "";
    }
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
};

export function MapForm({ mapTypes, onSuccess, notify }: MapFormProps) {
    const [submitting, setSubmitting] = useState(false);
    const [selectedType, setSelectedType] = useState(mapTypes[0] ?? "解密");

    const [form, setForm] = useState({
        coverImage: "",
        previewImage: "",
        code: "",
        type: selectedType,
        name: "",
        author: "",
        mappedAt: "",
        introduction: "",
        estimatedMinutes: 15
    });

    const canSubmit = useMemo(
        () => Boolean(form.coverImage && form.previewImage && form.code && form.name && form.author && form.mappedAt && form.introduction),
        [form]
    );

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        try {
            const response = await fetch("/api/state", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "map", payload: form })
            });
            if (!response.ok) {
                throw new Error("提交失败");
            }
            notify?.({ title: "地图已提交", message: `${form.name} 已加入历史记录。` });
            setForm((current) => ({
                ...current,
                coverImage: "",
                previewImage: "",
                code: "",
                name: "",
                author: "",
                mappedAt: "",
                introduction: "",
                estimatedMinutes: 15
            }));
            onSuccess?.();
        } catch (error) {
            notify?.({ title: "提交失败", message: error instanceof Error ? error.message : "请稍后再试" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-12">
            <div className="form-grid">
                <label className="label full">
                    封面
                    <input
                        className="input"
                        type="file"
                        accept="image/*"
                        onChange={async (event) => {
                            const file = event.target.files?.[0] ?? null;
                            setForm((current) => ({ ...current, coverImage: "" }));
                            if (file) {
                                setForm((current) => ({ ...current, coverImage: "" }));
                                const value = await readFileAsDataUrl(file);
                                setForm((current) => ({ ...current, coverImage: value }));
                            }
                        }}
                    />
                    <span className="help">上传后会作为地图封面保存到历史数据中。</span>
                </label>
                <label className="label full">
                    内容预览图
                    <input
                        className="input"
                        type="file"
                        accept="image/*"
                        onChange={async (event) => {
                            const file = event.target.files?.[0] ?? null;
                            if (file) {
                                const value = await readFileAsDataUrl(file);
                                setForm((current) => ({ ...current, previewImage: value }));
                            }
                        }}
                    />
                </label>
                <label className="label">
                    地图代码
                    <input className="input" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="例如 MM-2026-03" />
                </label>
                <label className="label">
                    地图类型
                    <select className="select" value={selectedType} onChange={(event) => { setSelectedType(event.target.value); setForm({ ...form, type: event.target.value }); }}>
                        {mapTypes.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="label">
                    地图名
                    <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </label>
                <label className="label">
                    作者名
                    <input className="input" value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} />
                </label>
                <label className="label">
                    制图时间
                    <input className="input" type="date" value={form.mappedAt} onChange={(event) => setForm({ ...form, mappedAt: event.target.value })} />
                </label>
                <label className="label">
                    预计游玩时间（分钟）
                    <input className="input" type="number" min="1" max="999" value={form.estimatedMinutes} onChange={(event) => setForm({ ...form, estimatedMinutes: Number(event.target.value) })} />
                </label>
                <label className="label full">
                    地图介绍
                    <textarea className="textarea" value={form.introduction} onChange={(event) => setForm({ ...form, introduction: event.target.value })} />
                </label>
            </div>
            <button className="button button-primary" disabled={!canSubmit || submitting} type="submit">
                {submitting ? "提交中..." : "提交地图"}
            </button>
        </form>
    );
}

export function ReviewForm({ maps, onSuccess, notify }: ReviewFormProps) {
    const [submitting, setSubmitting] = useState(false);
    const [anonymous, setAnonymous] = useState(false);
    const [form, setForm] = useState({
        mapId: maps[0]?.id ?? "",
        reviewerName: "",
        anonymous: false,
        ratings: {
            entertainment: 5,
            aesthetics: 5,
            guidance: 5,
            difficulty: 5,
            overall: 5
        },
        comment: ""
    });

    const handleRating = (key: keyof RatingDimensions, value: number) => {
        setForm((current) => ({ ...current, ratings: { ...current.ratings, [key]: clampScore(value) } }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        try {
            const response = await fetch("/api/state", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "review",
                    payload: {
                        ...form,
                        anonymous,
                        reviewerName: anonymous ? "匿名" : form.reviewerName
                    }
                })
            });
            if (!response.ok) {
                throw new Error("评价提交失败");
            }
            notify?.({ title: "评价已提交", message: "雷达图与排行榜将自动更新。" });
            setForm((current) => ({
                ...current,
                reviewerName: "",
                comment: "",
                ratings: {
                    entertainment: 5,
                    aesthetics: 5,
                    guidance: 5,
                    difficulty: 5,
                    overall: 5
                }
            }));
            onSuccess?.();
        } catch (error) {
            notify?.({ title: "提交失败", message: error instanceof Error ? error.message : "请稍后再试" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-12">
            <div className="form-grid">
                <label className="label full">
                    选择地图
                    <select className="select" value={form.mapId} onChange={(event) => setForm({ ...form, mapId: event.target.value })}>
                        {maps.map((map) => (
                            <option key={map.id} value={map.id}>
                                {map.name} · {map.code}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="label">
                    姓名
                    <input className="input" disabled={anonymous} value={form.reviewerName} onChange={(event) => setForm({ ...form, reviewerName: event.target.value })} placeholder="提交评价时可填写姓名" />
                </label>
                <label className="label">
                    匿名提交
                    <label className="upload-row">
                        <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />
                        <span className="help">匿名后将不会显示姓名。</span>
                    </label>
                </label>
                {ratingKeys.map((key) => (
                    <label className="label" key={key}>
                        {ratingLabelText[key]}
                        <input className="input" type="range" min="1" max="5" value={form.ratings[key]} onChange={(event) => handleRating(key, Number(event.target.value))} />
                        <span className="help">当前评分：{form.ratings[key]} 星</span>
                    </label>
                ))}
                <label className="label full">
                    评价内容
                    <textarea className="textarea" value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} />
                </label>
            </div>
            <button className="button button-primary" disabled={!form.mapId || (!anonymous && !form.reviewerName) || submitting} type="submit">
                {submitting ? "提交中..." : "提交评价"}
            </button>
        </form>
    );
}

export function AdminLogin({ onLogin, currentToken }: AdminLoginProps) {
    const [value, setValue] = useState(currentToken);

    return (
        <div className="grid gap-12">
            <label className="label full">
                管理员令牌
                <input className="input" value={value} onChange={(event) => setValue(event.target.value)} placeholder="输入 ADMIN_TOKEN" />
            </label>
            <button className="button button-primary" onClick={() => onLogin(value)} type="button">
                保存令牌
            </button>
        </div>
    );
}
