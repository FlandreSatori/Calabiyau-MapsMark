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

export const topEvents = (state: AppState, count = 8) =>
    [...state.events].sort((left, right) => right.timestamp.localeCompare(left.timestamp)).slice(0, count);

export const visibleMaps = (state: AppState) => state.maps.filter((item) => !item.deletedAt);

export const visibleReviews = (state: AppState) => state.reviews.filter((item) => !item.deletedAt);

export const getMapById = (state: AppState, id: string) => state.maps.find((item) => item.id === id && !item.deletedAt) ?? null;
