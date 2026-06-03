import type { AppState, MapRecord, RatingDimensions, ReviewRecord } from "@/lib/types";

export const emptyRatings = (): RatingDimensions => ({
    entertainment: 0,
    aesthetics: 0,
    guidance: 0,
    difficulty: 0,
    overall: 0
});

export const averageRatings = (reviews: ReviewRecord[], mapId?: string) => {
    const filtered = mapId ? reviews.filter((item) => item.mapId === mapId && !item.deletedAt) : reviews.filter((item) => !item.deletedAt);
    if (filtered.length === 0) {
        return emptyRatings();
    }

    const totals = filtered.reduce(
        (accumulator, review) => {
            accumulator.entertainment += review.ratings.entertainment;
            accumulator.aesthetics += review.ratings.aesthetics;
            accumulator.guidance += review.ratings.guidance;
            accumulator.difficulty += review.ratings.difficulty;
            accumulator.overall += review.ratings.overall;
            return accumulator;
        },
        emptyRatings()
    );

    return {
        entertainment: totals.entertainment / filtered.length,
        aesthetics: totals.aesthetics / filtered.length,
        guidance: totals.guidance / filtered.length,
        difficulty: totals.difficulty / filtered.length,
        overall: totals.overall / filtered.length
    };
};

export const mapScore = (reviews: ReviewRecord[], mapId: string, metric: keyof RatingDimensions) => {
    const filtered = reviews.filter((item) => item.mapId === mapId && !item.deletedAt);
    if (filtered.length === 0) {
        return 0;
    }
    const total = filtered.reduce((sum, review) => sum + review.ratings[metric], 0);
    return total / filtered.length;
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
    good: countAboveThreshold(ratings, 0) >= 2 && countAboveThreshold(ratings, 0) <= 3,
    god: countAboveThreshold(ratings, 3) >= 2 && countAboveThreshold(ratings, 3) <= 3,
    shenren: countBelowThreshold(ratings, 0) >= 1 && countBelowThreshold(ratings, 0) <= 2,
    poop: countBelowThreshold(ratings, 0) >= 3
});

export const countMapTypes = (state: AppState) =>
    visibleMaps(state).reduce<Record<string, number>>((accumulator, map) => {
        accumulator[map.type] = (accumulator[map.type] ?? 0) + 1;
        return accumulator;
    }, {});

export const countMapCategories = (state: AppState) => {
    const totals = { good: 0, god: 0, shenren: 0, poop: 0 };
    visibleMaps(state).forEach((map) => {
        const ratings = averageRatings(state.reviews, map.id);
        const classification = classifyRatings(ratings);
        if (classification.good) totals.good += 1;
        if (classification.god) totals.god += 1;
        if (classification.shenren) totals.shenren += 1;
        if (classification.poop) totals.poop += 1;
    });
    return totals;
};
