import type { AppState, MapRecord, RatingDimensions, ReviewRecord } from "@/lib/types";

export const emptyRatings = (): RatingDimensions => ({
    entertainment: 0,
    aesthetics: 0,
    guidance: 0,
    difficulty: 0,
    overall: 0
});

type ReviewSentimentFilter = "all" | "positive" | "negative";

const sentimentMatchesValue = (value: number, sentiment: ReviewSentimentFilter) => {
    if (sentiment === "positive") {
        return value > 0;
    }
    if (sentiment === "negative") {
        return value < 0;
    }
    return true;
};

const ratingDimensionKeys: Array<keyof RatingDimensions> = ["entertainment", "aesthetics", "guidance", "difficulty", "overall"];

export const averageRatings = (reviews: ReviewRecord[], mapId?: string, sentiment: ReviewSentimentFilter = "positive") => {
    const filtered = (mapId ? reviews.filter((item) => item.mapId === mapId && !item.deletedAt) : reviews.filter((item) => !item.deletedAt));
    if (filtered.length === 0) {
        return emptyRatings();
    }

    const totals = emptyRatings();
    const counts = emptyRatings();

    filtered.forEach((review) => {
        ratingDimensionKeys.forEach((metric) => {
            const value = review.ratings[metric];
            if (sentimentMatchesValue(value, sentiment)) {
                totals[metric] += value;
                counts[metric] += 1;
            }
        });
    });

    return {
        entertainment: counts.entertainment > 0 ? totals.entertainment / counts.entertainment : 0,
        aesthetics: counts.aesthetics > 0 ? totals.aesthetics / counts.aesthetics : 0,
        guidance: counts.guidance > 0 ? totals.guidance / counts.guidance : 0,
        difficulty: counts.difficulty > 0 ? totals.difficulty / counts.difficulty : 0,
        overall: counts.overall > 0 ? totals.overall / counts.overall : 0
    };
};

export const mapScore = (reviews: ReviewRecord[], mapId: string, metric: keyof RatingDimensions, sentiment: ReviewSentimentFilter = "positive") => {
    const filtered = reviews.filter((item) => item.mapId === mapId && !item.deletedAt);
    if (filtered.length === 0) {
        return 0;
    }
    const picked = filtered
        .map((review) => review.ratings[metric])
        .filter((value) => sentimentMatchesValue(value, sentiment));
    if (picked.length === 0) {
        return 0;
    }
    const total = picked.reduce((sum, value) => sum + value, 0);
    return total / picked.length;
};

export const overallScore = (reviews: ReviewRecord[], mapId: string, sentiment: ReviewSentimentFilter = "positive") => {
    return averageRatings(reviews, mapId, sentiment).overall;
};

export const getRatingLabelByOverallScore = (score: number) => {
    if (score >= 4) {
        return "神图";
    }
    if (score >= 3) {
        return "好图";
    }
    if (score >= 2) {
        return "神人图";
    }
    return "史图";
};

export const getScoreBucketLabel = (score: number) => {
    if (score >= 4) {
        return "4分以上";
    }
    if (score >= 3) {
        return "3分以上";
    }
    if (score >= 2) {
        return "2分以上";
    }
    if (score >= 1) {
        return "1分以上";
    }
    return "0分以上";
};

export const getMapRatingLabel = (reviews: ReviewRecord[], mapId: string, sentiment: ReviewSentimentFilter = "positive") => {
    const filtered = reviews.filter((item) => item.mapId === mapId && !item.deletedAt);
    if (filtered.length === 0) {
        return null;
    }
    const ratings = averageRatings(filtered, undefined, sentiment);
    const category = classifyMapCategoryByRatings(ratings);
    if (category === "god") return "神图";
    if (category === "good") return "好图";
    if (category === "poop") return "史图";
    if (category === "shenren") return "神人图";
    return null;
};

export const getScoreBucketKey = (score: number) => {
    if (score >= 4) {
        return "4";
    }
    if (score >= 3) {
        return "3";
    }
    if (score >= 2) {
        return "2";
    }
    if (score >= 1) {
        return "1";
    }
    return "0";
};

export const matchesScoreBucket = (score: number, bucket: string) => {
    if (bucket === "4") return score >= 4;
    if (bucket === "3") return score >= 3 && score < 4;
    if (bucket === "2") return score >= 2 && score < 3;
    if (bucket === "1") return score >= 1 && score < 2;
    if (bucket === "0") return score >= 0 && score < 1;
    return true;
};

export const aggregateByMetric = (state: AppState, metric: keyof RatingDimensions) => {
    return state.maps
        .filter((item) => !item.deletedAt)
        .map((item) => ({
            map: item,
            score: mapScore(state.reviews, item.id, metric),
            reviewCount: state.reviews.filter((review) => review.mapId === item.id && !review.deletedAt).length
        }))
        .sort((left, right) => right.score - left.score || right.reviewCount - left.reviewCount);
};

export const topEvents = (state: AppState, count?: number) => {
    const sorted = [...state.events].sort((left, right) => right.timestamp.localeCompare(left.timestamp));
    return typeof count === "number" ? sorted.slice(0, count) : sorted;
};

export const visibleMaps = (state: AppState) => state.maps.filter((item) => !item.deletedAt);

export const visibleReviews = (state: AppState) => state.reviews.filter((item) => !item.deletedAt);

export const getMapById = (state: AppState, id: string) => state.maps.find((item) => item.id === id && !item.deletedAt) ?? null;

export const ratingDimensionsWithoutDifficulty = ["entertainment", "aesthetics", "guidance", "overall"] as const;

export const countAboveThreshold = (ratings: RatingDimensions, threshold: number, dimensions = ratingDimensionsWithoutDifficulty) =>
    dimensions.filter((dimension) => ratings[dimension] > threshold).length;

export const countBelowThreshold = (ratings: RatingDimensions, threshold: number, dimensions = ratingDimensionsWithoutDifficulty) =>
    dimensions.filter((dimension) => ratings[dimension] < threshold).length;

export const classifyRatings = (ratings: RatingDimensions) => ({
    god: countAboveThreshold(ratings, 3.5) >= 3,
    good: countAboveThreshold(ratings, 2) >= 3,
    shenren: countBelowThreshold(ratings, 2) >= 1,
    poop: countBelowThreshold(ratings, 2) >= 3
});

const classifyMapCategoryByRatings = (ratings: RatingDimensions): "good" | "god" | "shenren" | "poop" | null => {
    const classification = classifyRatings(ratings);
    if (classification.god) return "god";
    if (classification.good) return "good";
    if (classification.poop) return "poop";
    if (classification.shenren) return "shenren";
    return null;
};

export const countMapTypes = (state: AppState) =>
    visibleMaps(state).reduce<Record<string, number>>((accumulator, map) => {
        accumulator[map.type] = (accumulator[map.type] ?? 0) + 1;
        return accumulator;
    }, {});

export const countMapCategories = (state: AppState) => {
    const totals = { good: 0, god: 0, shenren: 0, poop: 0 };
    visibleMaps(state).forEach((map) => {
        const label = getMapRatingLabel(state.reviews, map.id);
        if (label === "神图") totals.god += 1;
        else if (label === "好图") totals.good += 1;
        else if (label === "史图") totals.poop += 1;
        else if (label === "神人图") totals.shenren += 1;
    });
    return totals;
};
