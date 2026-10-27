"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { compressAndUpload } from "@/components/forms";
import { notify } from "@/components/toast";
import type { MapInput, MapRecord, ReviewInput, ReviewRecord } from "@/lib/types";

const proposerNameStorageKey = "mapsmark-reviewer-name";

const readSavedName = () => {
    try {
        return window.sessionStorage.getItem(proposerNameStorageKey) ?? "";
    } catch {
        return "";
    }
};

const saveName = (name: string) => {
    try {
        if (name) {
            window.sessionStorage.setItem(proposerNameStorageKey, name);
        } else {
            window.sessionStorage.removeItem(proposerNameStorageKey);
        }
    } catch {
        // ignore storage errors
    }
};

const submitChangeRequest = async (payload: {
    kind: "map-edit" | "review-edit" | "review-delete";
    targetId: string;
    proposerName: string;
    reason: string;
    patch?: Partial<MapInput> | Partial<ReviewInput>;
}) => {
    const response = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "change-request", payload })
    });
    if (!response.ok) {
        const textBody = await response.text();
        let message = "提交失败";
        try {
            message = (JSON.parse(textBody) as { message?: string })?.message ?? message;
        } catch {
            message = textBody || message;
        }
        throw new Error(message);
    }
};

type MapEditRequestProps = {
    map: MapRecord;
    mapTypes: string[];
};

export function MapEditRequest({ map, mapTypes }: MapEditRequestProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [proposerName, setProposerName] = useState("");
    const [reason, setReason] = useState("");
    const [form, setForm] = useState({
        coverImage: map.coverImage,
        previewImage: map.previewImage,
        code: map.code,
        type: map.type,
        name: map.name,
        author: map.author,
        mappedAt: map.mappedAt,
        introduction: map.introduction,
        estimatedMinutes: map.estimatedMinutes,
        delisted: Boolean(map.delisted)
    });

    const openForm = () => {
        setProposerName(readSavedName());
        setOpen(true);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!reason.trim()) {
            notify("error", "提交失败", "请填写修改原因。");
            return;
        }
        const patch: Partial<MapInput> = {};
        (Object.keys(form) as Array<keyof typeof form>).forEach((key) => {
            const current = key === "delisted" ? Boolean(map.delisted) : map[key];
            if (form[key] !== current) {
                (patch as Record<string, unknown>)[key] = form[key];
            }
        });
        if (Object.keys(patch).length === 0) {
            notify("info", "没有改动", "请至少修改一个字段后再提交。");
            return;
        }
        setSubmitting(true);
        try {
            await submitChangeRequest({
                kind: "map-edit",
                targetId: map.id,
                proposerName: proposerName.trim(),
                reason,
                patch
            });
            saveName(proposerName.trim());
            notify("success", "修改请求已提交", "管理员审核通过后将自动生效。");
            setOpen(false);
            setReason("");
            router.refresh();
        } catch (error) {
            notify("error", "提交失败", error instanceof Error ? error.message : "请稍后再试");
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) {
        return (
            <div style={{ marginTop: 12 }}>
                <button className="button button-rect button-danger" type="button" onClick={openForm}>
                    编辑地图
                </button>
            </div>
        );
    }

    return (
        <form className="grid gap-12" style={{ marginTop: 18 }} onSubmit={handleSubmit}>
            <p className="section-title" style={{ margin: 0 }}>提交地图修改请求</p>
            <div className="form-grid">
                <label className="label full">
                    更换封面（可选）
                    <input
                        className="input"
                        type="file"
                        accept="image/*"
                        onChange={async (event) => {
                            const file = event.target.files?.[0] ?? null;
                            if (!file) return;
                            try {
                                notify("info", "上传中", "正在压缩并上传封面图片，请稍候...");
                                const url = await compressAndUpload(file, {});
                                setForm((current) => ({ ...current, coverImage: url }));
                                notify("success", "上传成功", "封面已上传。");
                            } catch (error) {
                                notify("error", "上传失败", error instanceof Error ? error.message : "请稍后再试");
                            }
                        }}
                    />
                </label>
                <label className="label full">
                    更换内容预览图（可选）
                    <input
                        className="input"
                        type="file"
                        accept="image/*"
                        onChange={async (event) => {
                            const file = event.target.files?.[0] ?? null;
                            if (!file) return;
                            try {
                                notify("info", "上传中", "正在压缩并上传预览图片，请稍候...");
                                const url = await compressAndUpload(file, {});
                                setForm((current) => ({ ...current, previewImage: url }));
                                notify("success", "上传成功", "预览图已上传。");
                            } catch (error) {
                                notify("error", "上传失败", error instanceof Error ? error.message : "请稍后再试");
                            }
                        }}
                    />
                </label>
                <label className="label">
                    地图代码
                    <input className="input" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
                    <button
                        className={`button button-rect${form.delisted ? " button-danger" : ""}`}
                        type="button"
                        style={{ marginTop: 8 }}
                        onClick={() => setForm((current) => ({ ...current, delisted: !current.delisted }))}
                    >
                        {form.delisted ? "🗑 已下架（点击取消）" : "标记为已下架"}
                    </button>
                    {form.delisted !== Boolean(map.delisted) ? (
                        <span className="help" style={{ color: "#ffb1bb" }}>
                            {form.delisted ? "提交并审批通过后，该地图将标记为已下架。" : "提交并审批通过后，将取消该地图的下架标记。"}
                        </span>
                    ) : null}
                </label>
                <label className="label">
                    地图类型
                    <select className="select" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                        {mapTypes.map((item) => (
                            <option key={item} value={item}>{item}</option>
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
                <label className="label">
                    你的名称（可选，留空为匿名）
                    <input className="input" value={proposerName} onChange={(event) => setProposerName(event.target.value)} />
                </label>
                <label className="label full">
                    修改原因 <span className="required-mark">*</span>
                    <textarea className="textarea" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="请说明为什么要这样修改" />
                </label>
            </div>
            <div className="admin-map-actions">
                <button className="button button-primary" type="submit" disabled={submitting}>
                    {submitting ? "提交中..." : "提交修改请求"}
                </button>
                <button className="button" type="button" disabled={submitting} onClick={() => setOpen(false)}>
                    取消
                </button>
            </div>
            <p className="help" style={{ margin: 0 }}>提交后需管理员审核，通过后修改才会生效，历史版本会被保留。</p>
        </form>
    );
}

type ReviewRequestControlsProps = {
    review: ReviewRecord;
};

const PencilIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
);

const TrashIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v5M14 11v5" />
    </svg>
);

export function ReviewRequestControls({ review }: ReviewRequestControlsProps) {
    const router = useRouter();
    const [mode, setMode] = useState<"none" | "edit" | "delete">("none");
    const [comment, setComment] = useState(review.comment);
    const [proposerName, setProposerName] = useState("");
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const openMode = (next: "edit" | "delete") => {
        setProposerName(readSavedName());
        setComment(review.comment);
        setMode(next);
    };

    const handleSubmit = async () => {
        if (!reason.trim()) {
            notify("error", "提交失败", "请填写申请原因。");
            return;
        }
        if (mode === "edit" && comment.trim() === review.comment.trim()) {
            notify("info", "没有改动", "请修改评价内容后再提交。");
            return;
        }
        setSubmitting(true);
        try {
            await submitChangeRequest({
                kind: mode === "edit" ? "review-edit" : "review-delete",
                targetId: review.id,
                proposerName: proposerName.trim(),
                reason,
                ...(mode === "edit" ? { patch: { comment: comment.trim() } } : {})
            });
            saveName(proposerName.trim());
            notify("success", "请求已提交", "管理员审核通过后将自动生效。");
            setMode("none");
            setReason("");
            router.refresh();
        } catch (error) {
            notify("error", "提交失败", error instanceof Error ? error.message : "请稍后再试");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="review-request">
            <div className="review-icon-actions">
                <button
                    className={`review-icon-button${mode === "edit" ? " is-active" : ""}`}
                    type="button"
                    title="请求修改评价"
                    aria-label="请求修改评价"
                    onClick={() => (mode === "edit" ? setMode("none") : openMode("edit"))}
                >
                    <PencilIcon />
                </button>
                <button
                    className={`review-icon-button is-danger${mode === "delete" ? " is-active" : ""}`}
                    type="button"
                    title="请求删除评价"
                    aria-label="请求删除评价"
                    onClick={() => (mode === "delete" ? setMode("none") : openMode("delete"))}
                >
                    <TrashIcon />
                </button>
            </div>
            {mode !== "none" ? (
                <div className="grid gap-12" style={{ marginTop: 12 }}>
                    {mode === "edit" ? (
                        <label className="label full">
                            修改后的评价内容
                            <textarea className="textarea" value={comment} onChange={(event) => setComment(event.target.value)} />
                        </label>
                    ) : (
                        <p className="help" style={{ margin: 0, color: "#ffb1bb" }}>将申请删除这条评价，管理员通过后该评价会被移除（记录保留）。</p>
                    )}
                    <label className="label">
                        你的名称（可选，留空为匿名）
                        <input className="input" value={proposerName} onChange={(event) => setProposerName(event.target.value)} />
                    </label>
                    <label className="label full">
                        申请原因 <span className="required-mark">*</span>
                        <textarea className="textarea" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="请说明申请原因" />
                    </label>
                    <div className="admin-map-actions">
                        <button className="button button-primary" type="button" disabled={submitting} onClick={() => void handleSubmit()}>
                            {submitting ? "提交中..." : mode === "edit" ? "提交修改请求" : "提交删除请求"}
                        </button>
                        <button className="button" type="button" disabled={submitting} onClick={() => setMode("none")}>
                            取消
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
