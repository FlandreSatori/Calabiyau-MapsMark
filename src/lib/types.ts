export type MapType = string;

export type RatingDimensions = {
    entertainment: number;
    aesthetics: number;
    guidance: number;
    difficulty: number;
    overall: number;
};

export type MapRecord = {
    id: string;
    coverImage: string;
    previewImage: string;
    code: string;
    type: MapType;
    name: string;
    author: string;
    mappedAt: string;
    introduction: string;
    estimatedMinutes: number;
    /** 地图代码已下架（不可再使用） */
    delisted?: boolean;
    submittedAt: string;
    updatedAt: string;
    deletedAt?: string;
};

export type ReviewRecord = {
    id: string;
    mapId: string;
    reviewerName: string;
    anonymous: boolean;
    ratings: RatingDimensions;
    comment: string;
    submittedAt: string;
    updatedAt: string;
    deletedAt?: string;
};

export type EventRecord = {
    id: string;
    kind:
        | "map-create"
        | "map-update"
        | "map-delete"
        | "review-create"
        | "review-update"
        | "review-delete"
        | "request-create"
        | "request-approve"
        | "request-reject";
    subjectId: string;
    title: string;
    timestamp: string;
    detail?: string;
};

export type ChangeRequestKind = "map-edit" | "review-edit" | "review-delete";

export type ChangeRequestRecord = {
    id: string;
    kind: ChangeRequestKind;
    targetId: string;
    proposerName: string;
    reason: string;
    patch?: Partial<MapInput> | Partial<ReviewInput>;
    status: "pending" | "approved" | "rejected";
    submittedAt: string;
    resolvedAt?: string;
    resolveNote?: string;
    /** 审批通过时保存的修改前完整版本，作为历史版本保留 */
    snapshot?: MapRecord | ReviewRecord;
};

export type AppState = {
    maps: MapRecord[];
    reviews: ReviewRecord[];
    events: EventRecord[];
    updatedAt: string;
    mapTypes?: string[];
    changeRequests?: ChangeRequestRecord[];
    ui?: {
        background?: string;
    };
};

export type MapInput = Omit<MapRecord, "id" | "submittedAt" | "updatedAt" | "deletedAt">;
export type ReviewInput = Omit<ReviewRecord, "id" | "submittedAt" | "updatedAt" | "deletedAt">;

export const ratingLabels: Array<keyof RatingDimensions> = [
    "entertainment",
    "aesthetics",
    "guidance",
    "difficulty",
    "overall"
];

export const ratingLabelText: Record<keyof RatingDimensions, string> = {
    entertainment: "趣味性",
    aesthetics: "美观性",
    guidance: "引导性",
    difficulty: "难易度",
    overall: "总体评价"
};

export const defaultMapTypes = ["解密", "跑酷", "观景", "追击"] as const;

export const allRatingLabels = ratingLabels.map((key) => ratingLabelText[key]);
