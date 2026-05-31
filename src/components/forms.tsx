"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

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

const emptyRatings = (): RatingDimensions => ({
    entertainment: 0,
    aesthetics: 0,
    guidance: 0,
    difficulty: 0,
    overall: 0
});

const createReviewDraft = () => ({
    ratings: emptyRatings(),
    comment: ""
});

type ReviewDraft = ReturnType<typeof createReviewDraft>;

function StarSlider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
    const fill = `${(Math.abs(value) / 5) * 100}%`;
    const isNegative = value < 0;

    return (
        <div className="star-slider">
            <div className="star-slider-head">
                <span>{label}</span>
                <strong className={isNegative ? "is-negative" : ""}>{value.toFixed(1)}</strong>
            </div>
            <div className={`star-slider-track${isNegative ? " is-negative" : ""}`} aria-hidden="true">
                <span className="star-slider-base">★★★★★</span>
                <span className="star-slider-fill" style={{ width: fill }}>★★★★★</span>
            </div>
            <input
                className="star-slider-range"
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
            />
        </div>
    );
}

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
    const [anonymous, setAnonymous] = useState(false);
    const [reviewerName, setReviewerName] = useState("");
    const [submittingMapId, setSubmittingMapId] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>(() =>
        Object.fromEntries(maps.map((map) => [map.id, createReviewDraft()]))
    );

    useEffect(() => {
        setDrafts((current) => {
            const next: Record<string, ReviewDraft> = {};
            maps.forEach((map) => {
                next[map.id] = current[map.id] ?? createReviewDraft();
            });
            return next;
        });
    }, [maps]);

    const updateDraft = (mapId: string, patch: Partial<ReviewDraft>) => {
        setDrafts((current) => ({
            ...current,
            [mapId]: {
                ...(current[mapId] ?? createReviewDraft()),
                ...patch
            }
        }));
    };

    const submitReview = async (mapId: string) => {
        const draft = drafts[mapId] ?? createReviewDraft();
        if (!anonymous && !reviewerName.trim()) {
            notify?.({ title: "提交失败", message: "请先填写姓名，或者勾选匿名提交。" });
            return;
        }
        setSubmittingMapId(mapId);
        try {
            const response = await fetch("/api/state", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "review",
                    payload: {
                        mapId,
                        reviewerName: anonymous ? "匿名" : reviewerName,
                        anonymous,
                        ratings: draft.ratings,
                        comment: draft.comment
                    }
                })
            });
            if (!response.ok) {
                throw new Error("评价提交失败");
            }
            notify?.({ title: "评价已提交", message: "该地图的评分已保存。" });
            setDrafts((current) => ({
                ...current,
                [mapId]: createReviewDraft()
            }));
            onSuccess?.();
        } catch (error) {
            notify?.({ title: "提交失败", message: error instanceof Error ? error.message : "请稍后再试" });
        } finally {
            setSubmittingMapId(null);
        }
    };

    return (
        <div className="grid gap-12">
            <div className="review-shell panel panel-strong panel-pad">
                <div className="form-grid">
                    <label className="label">
                        姓名
                        <input className="input" disabled={anonymous} value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} placeholder="提交评价时可填写姓名" />
                    </label>
                    <label className="label">
                        匿名提交
                        <label className="upload-row">
                            <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />
                            <span className="help">匿名后将不会显示姓名。</span>
                        </label>
                    </label>
                </div>
            </div>

            <div className="review-board">
                {maps.map((map) => {
                    const draft = drafts[map.id] ?? createReviewDraft();
                    return (
                        <section className="review-row panel panel-pad" key={map.id}>
                            <div className="list-row">
                                <div>
                                    <strong>{map.name}</strong>
                                    <div className="help">{map.type} · {map.code} · {map.author}</div>
                                </div>
                                <button className="button button-primary" type="button" onClick={() => void submitReview(map.id)} disabled={submittingMapId === map.id || (!anonymous && !reviewerName.trim())}>
                                    {submittingMapId === map.id ? "提交中..." : "提交该图评价"}
                                </button>
                            </div>
                            <div className="review-rating-grid">
                                {ratingKeys.map((key) => (
                                    <StarSlider
                                        key={key}
                                        label={ratingLabelText[key]}
                                        value={draft.ratings[key]}
                                        onChange={(value) => updateDraft(map.id, { ratings: { ...draft.ratings, [key]: clampScore(value) } })}
                                    />
                                ))}
                            </div>
                            <label className="label full">
                                评价内容
                                <textarea className="textarea" value={draft.comment} onChange={(event) => updateDraft(map.id, { comment: event.target.value })} />
                            </label>
                        </section>
                    );
                })}
            </div>
        </div>
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
