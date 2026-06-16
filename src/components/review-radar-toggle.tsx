"use client";

import { useEffect, useRef, useState } from "react";

import { RadarChart } from "@/components/radar-chart";
import { ratingLabelText, ratingLabels, type RatingDimensions } from "@/lib/types";

type ReviewRadarToggleProps = {
    positiveValues: RatingDimensions;
    negativeValues: RatingDimensions;
    positiveCount: number;
    negativeCount: number;
};

export function ReviewRadarToggle({ positiveValues, negativeValues, positiveCount, negativeCount }: ReviewRadarToggleProps) {
    const [mode, setMode] = useState<"positive" | "negative">(positiveCount > 0 ? "positive" : "negative");
    const [isPortraitPhone, setIsPortraitPhone] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const initializedCollapse = useRef(false);
    const values = mode === "positive" ? positiveValues : negativeValues;
    const tone = mode === "positive" ? "positive" : "negative";
    const activeCount = mode === "positive" ? positiveCount : negativeCount;

    useEffect(() => {
        const query = window.matchMedia("(max-width: 640px) and (orientation: portrait)");
        const update = () => setIsPortraitPhone(query.matches);
        update();
        query.addEventListener?.("change", update);
        query.addListener?.(update);
        return () => {
            query.removeEventListener?.("change", update);
            query.removeListener?.(update);
        };
    }, []);

    useEffect(() => {
        if (isPortraitPhone && !initializedCollapse.current) {
            setCollapsed(true);
            initializedCollapse.current = true;
        }
    }, [isPortraitPhone]);

    return (
        <div className="review-radar-toggle">
            <button
                type="button"
                className="button button-rect review-radar-collapse-toggle"
                onClick={() => setCollapsed((current) => !current)}
                aria-expanded={!collapsed}
            >
                {collapsed ? "展开雷达图" : "收起雷达图"}
            </button>
            <div className="review-radar-switches" role="tablist" aria-label="雷达图切换">
                <button
                    type="button"
                    className={`button button-rect review-radar-switch${mode === "positive" ? " is-active" : ""}`}
                    onClick={() => setMode("positive")}
                >
                    好评 {positiveCount}
                </button>
                <button
                    type="button"
                    className={`button button-rect review-radar-switch${mode === "negative" ? " is-active" : ""}`}
                    onClick={() => setMode("negative")}
                >
                    差评 {negativeCount}
                </button>
            </div>
            {!collapsed ? <div className="review-radar-body">
                <div className="review-radar-chart-wrap">
                    <RadarChart values={values} dimensions={ratingLabels.slice(0, 5)} size={360} tone={tone} />
                </div>
                <div className="legend-grid review-radar-legend">
                    <div className="legend-row">
                        <span>{mode === "positive" ? "好评" : "差评"}评价数</span>
                        <strong>{activeCount}</strong>
                    </div>
                    {ratingLabels.map((label) => {
                        const value = values[label];
                        const isNegative = value < 0;
                        return (
                            <div className="legend-row" key={`${mode}-${label}`}>
                                <span>{ratingLabelText[label]}</span>
                                <strong className={isNegative ? "is-negative" : ""}>{value.toFixed(1)}</strong>
                            </div>
                        );
                    })}
                </div>
            </div> : null}
        </div>
    );
}
