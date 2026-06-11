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
    customCoverImage?: string;
    previewImage: string;
    customPreviewImage?: string;
    code: string;
    type: MapType;
    name: string;
    author: string;
    mappedAt: string;
    introduction: string;
    estimatedMinutes: number;
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
    kind: "map-create" | "map-update" | "map-delete" | "review-create" | "review-update" | "review-delete";
    subjectId: string;
    title: string;
    timestamp: string;
    detail?: string;
};

export type AppState = {
    maps: MapRecord[];
    reviews: ReviewRecord[];
    events: EventRecord[];
    updatedAt: string;
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
