"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { notify as globalNotify } from "@/components/toast";
import { useRouter } from "next/navigation";

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

const compressAndUpload = async (file: File, opts?: { maxDim?: number; quality?: number; notify?: (t: ToastState) => void }) => {
    const maxDim = opts?.maxDim ?? 1600;
    const quality = opts?.quality ?? 0.75;
    try {
        const dataUrl = await readFileAsDataUrl(file);
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = reject;
            el.src = dataUrl;
        });

        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
            const ratio = width > height ? maxDim / width : maxDim / height;
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("无法创建画布上下文");
        ctx.drawImage(img, 0, 0, width, height);

        const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve as BlobCallback, "image/jpeg", quality));
        if (!blob) throw new Error("图片压缩失败");

        const dataUrl2 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ""));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });

        const base64 = dataUrl2.split(",")[1] ?? "";

        // 上传到后端，后端再写入 GitHub
        const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const resp = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename, contentBase64: base64, contentType: "image/jpeg" })
        });
        const text = await resp.text();
        let payload: any = {};
        try {
            payload = JSON.parse(text);
        } catch (e) {
            payload = { message: text };
        }
        if (!resp.ok) {
            const message = payload?.message ?? `上传失败 (${resp.status})`;
            if (opts?.notify) opts.notify({ title: "上传失败", message });
            throw new Error(message);
        }
        return payload?.url as string;
    } catch (err) {
        throw err;
    }
};

export function MapForm({ mapTypes, onSuccess, notify }: MapFormProps) {
    const [submitting, setSubmitting] = useState(false);
    const [selectedType, setSelectedType] = useState(mapTypes[0] ?? "解密");
    const router = useRouter();

    const [touched, setTouched] = useState<Record<string, boolean>>({});

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
        // Required: coverImage, code, name, author. Other fields optional.
        () => Boolean(form.coverImage && form.code && form.name && form.author),
        [form]
    );

    const missingRequired = useMemo(() => {
        const missing: string[] = [];
        if (!form.coverImage) missing.push("封面未上传成功");
        if (!form.code) missing.push("地图代码");
        if (!form.name) missing.push("地图名");
        if (!form.author) missing.push("作者名");
        return missing;
    }, [form.coverImage, form.code, form.name, form.author]);

    const isInvalid = (key: keyof typeof form) => !form[key] && Boolean(touched[key]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        // 防止超大 payload 导致平台拒绝（FUNCTION_PAYLOAD_TOO_LARGE）
        try {
            const sample = JSON.stringify({ type: "map", payload: form });
            const size = new TextEncoder().encode(sample).length;
            const LIMIT = 3_500_000; // 3.5MB 保守阈值
            if (size > LIMIT) {
                const kb = Math.round(size / 1024);
                const msg = `请求体太大（约 ${kb}KB），请缩小图片或使用外部图床后重试。`;
                if (notify) {
                    notify({ title: "提交失败：文件过大", message: msg });
                } else {
                    globalNotify("error", "提交失败：文件过大", msg);
                }
                setSubmitting(false);
                return;
            }
        } catch (e) {
            // 如果检测失败也不阻塞提交，继续尝试
        }
        try {
            const response = await fetch("/api/state", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "map", payload: form })
            });
            if (!response.ok) {
                const textBody = await response.text();
                let message = "提交失败";
                try {
                    const payload = JSON.parse(textBody);
                    message = payload?.message ?? message;
                } catch {
                    message = textBody || message;
                }
                throw new Error(message);
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
            router.refresh();
            onSuccess?.();
        } catch (error) {
            const message = error instanceof Error ? error.message : "请稍后再试";
            if (notify) {
                notify({ title: "提交失败", message });
            } else {
                globalNotify("error", "提交失败", message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-12">
            <div className="form-grid">
                <label className="label full">
                    封面 <span style={{ color: "#ffcc00", marginLeft: 6 }}>*</span>
                    <input
                        className="input"
                        type="file"
                        accept="image/*"
                        onChange={async (event) => {
                            const file = event.target.files?.[0] ?? null;
                            setTouched((s) => ({ ...s, coverImage: true }));
                            setForm((current) => ({ ...current, coverImage: "" }));
                            if (file) {
                                try {
                                    globalNotify("info", "上传中", "正在压缩并上传封面图片，请稍候...");
                                    const url = await compressAndUpload(file, { notify });
                                    setForm((current) => ({ ...current, coverImage: url }));
                                    globalNotify("success", "上传成功", "封面已上传。");
                                } catch (e) {
                                    const message = e instanceof Error ? e.message : String(e);
                                    if (notify) notify({ title: "上传失败", message });
                                    else globalNotify("error", "上传失败", message);
                                }
                            }
                        }}
                    />
                    <span className="help">上传后会保存到 GitHub 仓库并将 URL 写入数据中。（必填）</span>
                </label>
                <label className="label full">
                    内容预览图 <span style={{ color: "#9aa0a6", marginLeft: 6 }}>（可选）</span>
                    <input
                        className="input"
                        type="file"
                        accept="image/*"
                        onChange={async (event) => {
                            const file = event.target.files?.[0] ?? null;
                            setTouched((s) => ({ ...s, previewImage: true }));
                            if (file) {
                                try {
                                    globalNotify("info", "上传中", "正在压缩并上传预览图片，请稍候...");
                                    const url = await compressAndUpload(file, { notify });
                                    setForm((current) => ({ ...current, previewImage: url }));
                                    globalNotify("success", "上传成功", "预览图已上传。");
                                } catch (e) {
                                    const message = e instanceof Error ? e.message : String(e);
                                    if (notify) notify({ title: "上传失败", message });
                                    else globalNotify("error", "上传失败", message);
                                }
                            }
                        }}
                    />
                </label>
                <label className="label">
                    地图代码 <span style={{ color: "#ffcc00", marginLeft: 6 }}>*</span>
                    <input className={`input${isInvalid("code") ? " input-invalid" : ""}`} value={form.code} onBlur={() => setTouched((s) => ({ ...s, code: true }))} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="abcdef" />
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
                    地图名 <span style={{ color: "#ffcc00", marginLeft: 6 }}>*</span>
                    <input className={`input${isInvalid("name") ? " input-invalid" : ""}`} value={form.name} onBlur={() => setTouched((s) => ({ ...s, name: true }))} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </label>
                <label className="label">
                    作者名 <span style={{ color: "#ffcc00", marginLeft: 6 }}>*</span>
                    <input className={`input${isInvalid("author") ? " input-invalid" : ""}`} value={form.author} onBlur={() => setTouched((s) => ({ ...s, author: true }))} onChange={(event) => setForm({ ...form, author: event.target.value })} />
                </label>
                <label className="label">
                    制图时间 <span style={{ color: "#9aa0a6", marginLeft: 6 }}>（可选）</span>
                    <input className="input" type="date" value={form.mappedAt} onChange={(event) => setForm({ ...form, mappedAt: event.target.value })} />
                </label>
                <label className="label">
                    预计游玩时间（分钟）
                    <input className="input" type="number" min="1" max="999" value={form.estimatedMinutes} onChange={(event) => setForm({ ...form, estimatedMinutes: Number(event.target.value) })} />
                </label>
                <label className="label full">
                    地图介绍 <span style={{ color: "#9aa0a6", marginLeft: 6 }}>（可选）</span>
                    <textarea className="textarea" value={form.introduction} onChange={(event) => setForm({ ...form, introduction: event.target.value })} />
                </label>
            </div>
            <button className="button button-primary" disabled={!canSubmit || submitting} type="submit">
                {submitting ? "提交中..." : "提交地图"}
            </button>
            {!canSubmit ? <p className="help" style={{ margin: 0, color: "#ffb1bb" }}>当前缺少：{missingRequired.join("、")}。</p> : null}
        </form>
    );
}

export function ReviewForm({ maps, onSuccess, notify }: ReviewFormProps) {
    const [anonymous, setAnonymous] = useState(false);
    const [reviewerName, setReviewerName] = useState("");
    const [nameInvalid, setNameInvalid] = useState(false);
    const [submittingMapId, setSubmittingMapId] = useState<string | null>(null);
    const router = useRouter();
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
            setNameInvalid(true);
            if (notify) {
                notify({ title: "提交失败", message: "请先填写姓名，或者勾选匿名提交。" });
            } else {
                globalNotify("error", "提交失败", "请先填写姓名，或者勾选匿名提交。");
            }
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
                const textBody = await response.text();
                let message = "评价提交失败";
                try {
                    const payload = JSON.parse(textBody);
                    message = payload?.message ?? message;
                } catch {
                    message = textBody || message;
                }
                throw new Error(message);
            }
            notify?.({ title: "评价已提交", message: "该地图的评分已保存。" });
            setDrafts((current) => ({
                ...current,
                [mapId]: createReviewDraft()
            }));
            router.refresh();
            onSuccess?.();
        } catch (error) {
            const message = error instanceof Error ? error.message : "请稍后再试";
            if (notify) {
                notify({ title: "提交失败", message });
            } else {
                globalNotify("error", "提交失败", message);
            }
        } finally {
            setSubmittingMapId(null);
        }
    };

    return (
        <div className="grid gap-12">
            <div className="review-shell panel panel-strong panel-pad">
                <div className="form-grid">
                    <label className="label">
                        名称
                        <input className="input" disabled={anonymous} value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} placeholder="提交评价时须填写名称或匿名" />
                        <div className="help" style={{ marginTop: 8 }}>
                            <div><strong>维度说明：</strong></div>
                            <div style={{ marginTop: 6 }}>
                                <div><strong>趣味性：</strong>是否有趣，是否值得二刷/带人，设计的谜题是否有创造性，是否环环相扣引人入胜，关卡节奏安排是否合理；  -5为无聊 +5为流连忘返</div>
                                <div style={{ marginTop: 6 }}><strong>美观性：</strong>场景是否自洽和谐，是否赏心悦目，是否有完整的世界观和气氛构建；  -5为简陋 +5为叹为观止</div>
                                <div style={{ marginTop: 6 }}><strong>引导性：</strong>游玩的时候是否感觉到迷茫，不知道干什么，卡关但不是因为被难住，试图无差别的蹭墙蹭草钻水;   -5为动线混沌，+5为动线清晰</div>
                                <div style={{ marginTop: 6 }}><strong>难易度：</strong>相互比较之下，需要思考/花费的时间多少，需要的知识储备多少；  -5为极难 +5为非常简单</div>
                            </div>
                        </div>
                    </label>
                    <label className="label">
                        匿名提交
                        <label className="upload-row">
                            <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />
                            <span className="help">匿名后评价将不会上传名称</span>
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
                                <div className="review-map-head">
                                    <img className="review-map-thumb" src={map.coverImage} alt={map.name} />
                                    <div>
                                        <strong>{map.name}</strong>
                                        <div className="help">{map.type} · {map.code} · {map.author}</div>
                                    </div>
                                </div>
                                <button className="button button-primary button-rect review-submit-button" type="button" onClick={() => void submitReview(map.id)} disabled={submittingMapId === map.id || (!anonymous && !reviewerName.trim())}>
                                    {submittingMapId === map.id ? "提交中..." : "提交评价"}
                                </button>
                            </div>
                            <div className="review-content-grid">
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
                                <label className="label full review-comment-block">
                                    评价内容
                                    <textarea className="textarea review-comment-textarea" value={draft.comment} onChange={(event) => updateDraft(map.id, { comment: event.target.value })} />
                                </label>
                            </div>
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
