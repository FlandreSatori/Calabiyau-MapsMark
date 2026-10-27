import type { AppState } from "@/lib/types";
import { defaultMapTypes } from "@/lib/types";
import { averageRatings, aggregateByMetric, topEvents, visibleMaps, visibleReviews, countMapCategories, countMapTypes } from "@/lib/metrics";

export const collectMapTypes = (state: AppState) => {
    const usedTypes = state.maps.filter((map) => !map.deletedAt).map((map) => map.type);
    return Array.from(new Set([...defaultMapTypes, ...(state.mapTypes ?? []), ...usedTypes])).filter(Boolean);
};

export const summarizeState = (state: AppState) => {
    const maps = visibleMaps(state);
    const reviews = visibleReviews(state);
    return {
        maps,
        reviews,
        events: topEvents(state),
        mapTypes: collectMapTypes(state),
        mapCount: maps.length,
        reviewCount: reviews.length,
        typeCounts: countMapTypes(state),
        categoryCounts: countMapCategories(state),
        bestByMetric: {
            entertainment: aggregateByMetric(state, "entertainment").slice(0, 5),
            aesthetics: aggregateByMetric(state, "aesthetics").slice(0, 5),
            guidance: aggregateByMetric(state, "guidance").slice(0, 5),
            difficulty: aggregateByMetric(state, "difficulty").slice(0, 5),
            overall: aggregateByMetric(state, "overall").slice(0, 5)
        }
    };
};
