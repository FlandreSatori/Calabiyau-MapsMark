import type { AppState } from "@/lib/types";
import { averageRatings, aggregateByMetric, topEvents, visibleMaps, visibleReviews } from "@/lib/metrics";

export const summarizeState = (state: AppState) => {
    const maps = visibleMaps(state);
    const reviews = visibleReviews(state);
    return {
        maps,
        reviews,
        events: topEvents(state),
        mapCount: maps.length,
        reviewCount: reviews.length,
        averages: averageRatings(reviews),
        bestByMetric: {
            entertainment: aggregateByMetric(state, "entertainment").slice(0, 5),
            aesthetics: aggregateByMetric(state, "aesthetics").slice(0, 5),
            guidance: aggregateByMetric(state, "guidance").slice(0, 5),
            difficulty: aggregateByMetric(state, "difficulty").slice(0, 5),
            overall: aggregateByMetric(state, "overall").slice(0, 5)
        }
    };
};
