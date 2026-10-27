"use client";

import { useState } from "react";

import { notify } from "@/components/toast";
import { formatDateTime } from "@/lib/format";
import type { ChangeRequestRecord, MapInput, MapRecord, ReviewInput, ReviewRecord } from "@/lib/types";

type ApprovalQueueProps = {
    requests: ChangeRequestRecord[];
    maps: MapRecord[];
    reviews: ReviewRecord[];
    token: string;
    onSaved: () => void;
};

const kindText: Record<ChangeRequestRecord["kind"], string> = {
    "map-edit": "地图修改",
    "review-edit": "评价修改",
    "review-delete": "评价删除"
};

const mapFieldText: Record<string, string> = {
    coverImage: "封面",
    previewImage: "预览图",
    code: "地图代码",
    type: "地图类型",
    name: "地图名",
    author: "作者名",
    mappedAt: "制图时间",
    introduction: "地图介绍",
    estimatedMinutes: "预计游玩时间",
    delisted: "已下架"
};

const reviewFieldText: Record<string, string> = {
    comment: "评价内容"
};

const formatValue = (key: string, value: unknown) => {
    if (key === "delisted") return value ? "是" : "否";
    if (value === undefined || value === null || value === "") return "（空）";
    if (key === "coverImage" || key === "previewImage") return value ? "（图片）" : "（空）";
    return String(value);
};

function RequestDiff({ request, maps, reviews }: { request: ChangeRequestRecord; maps: MapRecord[]; reviews: ReviewRecord[] }) {
    if (request.kind === "review-delete") {
        const target = reviews.find((item) => item.id === request.targetId);
        return <p className="hero-text" style={{ margin: 0 }}>删除评价：{target?.comment ?? "（评价已不存在）"}</p>;
    }
    const patch = (request.patch ?? {}) as Record<string, unknown>;
    const keys = Object.keys(patch);
    if (!keys.length) return <p className="help" style={{ margin: 0 }}>无字段变更。</p>;
    const target: Record<string, unknown> | undefined =
        request.kind === "map-edit"
            ? maps.find((item) => item.id === request.targetId)
            : reviews.find((item) => item.id === request.targetId);
    const fieldText = request.kind === "map-edit" ? mapFieldText : reviewFieldText;
    return (
        <div className="list">
            {keys.map((key) => (
                <div className="list-item" key={key}>
                    <div className="list-row">
                        <strong>{fieldText[key] ?? key}</strong>
                    </div>
                    <small className="help" style={{ display: "block", wordBreak: "break-all" }}>
                        原：{formatValue(key, target?.[key])}
                    </small>
                    <small style={{ display: "block", wordBreak: "break-all" }}>
                        新：{formatValue(key, patch[key])}
                    </small>
                </div>
            ))}
        </div>
    );
}

export function ApprovalQueue({ requests, maps, reviews, token, onSaved }: ApprovalQueueProps) {
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    const pending = requests.filter((item) => item.status === "pending");
    const resolved = requests.filter((item) => item.status !== "pending");

    const targetTitle = (request: ChangeRequestRecord) => {
        if (request.kind === "map-edit") {
            const map = maps.find((item) => item.id === request.targetId);
            return map ? `地图：${map.name}` : "地图：（已删除）";
        }
        const review = reviews.find((item) => item.id === request.targetId);
        if (!review) return "评价：（已删除）";
        const mapName = maps.find((item) => item.id === review.mapId)?.name ?? review.mapId;
        return `评价：${review.anonymous ? "匿名" : review.reviewerName} @ ${mapName}`;
    };

    const resolve = async (id: string, action: "approve" | "reject") => {
        setResolvingId(id);
        try {
            const response = await fetch("/api/state", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-admin-token": token },
                body: JSON.stringify({ type: "change-request-resolve", payload: { id, action, note: notes[id] ?? "" } })
            });
            if (!response.ok) {
                const textBody = await response.text();
                let message = "操作失败";
                try {
                    message = (JSON.parse(textBody) as { message?: string })?.message ?? message;
                } catch {
                    message = textBody || message;
                }
                throw new Error(message);
            }
            notify("success", action === "approve" ? "已通过" : "已拒绝", action === "approve" ? "修改已生效，历史版本已保留。" : "该请求已被拒绝。");
            onSaved();
        } catch (error) {
            notify("error", "操作失败", error instanceof Error ? error.message : "请稍后再试");
        } finally {
            setResolvingId(null);
        }
    };

    if (!requests.length) return <p className="help">暂无修改请求。</p>;

    return (
        <div className="grid gap-12">
            {pending.length ? (
                <div className="list">
                    {pending.map((request) => (
                        <div className="list-item" key={request.id}>
                            <div className="list-row">
                                <strong>{targetTitle(request)}</strong>
                                <span className="badge">{kindText[request.kind]}</span>
                            </div>
                            <div className="help">
                                {request.proposerName} 提交于 {formatDateTime(request.submittedAt)}
                            </div>
                            {request.reason ? <p className="hero-text" style={{ margin: 0 }}>原因：{request.reason}</p> : null}
                            <RequestDiff request={request} maps={maps} reviews={reviews} />
                            <label className="label full">
                                审批备注（可选）
                                <input
                                    className="input"
                                    value={notes[request.id] ?? ""}
                                    onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))}
                                    placeholder="拒绝时可填写原因"
                                />
                            </label>
                            <div className="admin-map-actions">
                                <button className="button button-primary" type="button" disabled={resolvingId === request.id} onClick={() => void resolve(request.id, "approve")}>
                                    {resolvingId === request.id ? "处理中..." : "通过并生效"}
                                </button>
                                <button className="button button-danger" type="button" disabled={resolvingId === request.id} onClick={() => void resolve(request.id, "reject")}>
                                    拒绝
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="help">没有待审批的请求。</p>
            )}

            {resolved.length ? (
                <>
                    <p className="section-title" style={{ margin: 0 }}>已处理</p>
                    <div className="list">
                        {resolved.map((request) => (
                            <div className="list-item" key={request.id}>
                                <div className="list-row">
                                    <strong>{targetTitle(request)}</strong>
                                    <span className={`badge${request.status === "rejected" ? " is-negative" : ""}`}>
                                        {request.status === "approved" ? "已通过" : "已拒绝"}
                                    </span>
                                </div>
                                <div className="help">
                                    {kindText[request.kind]} · {request.proposerName} 提交 · {request.resolvedAt ? formatDateTime(request.resolvedAt) : ""}
                                    {request.resolveNote ? ` · 备注：${request.resolveNote}` : ""}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : null}
        </div>
    );
}
