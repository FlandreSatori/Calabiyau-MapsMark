"use client";

import { useId } from "react";

import type { RatingDimensions } from "@/lib/types";
import { ratingLabelText } from "@/lib/types";

type RadarChartProps = {
    values: RatingDimensions;
    dimensions: Array<keyof RatingDimensions>;
    size?: number;
    tone?: "positive" | "negative";
};

const viewBoxSize = 440;
const center = viewBoxSize / 2;
const radius = 150;

const clampScore = (value: number) => Math.max(-5, Math.min(5, value));

const pointFor = (index: number, total: number, value: number, tone: "positive" | "negative", chartRadius = radius) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const baseScore = tone === "negative" ? Math.abs(clampScore(value)) : clampScore(value);
    const distance = chartRadius * (baseScore / 5);
    return {
        x: center + Math.cos(angle) * distance,
        y: center + Math.sin(angle) * distance
    };
};

export function RadarChart({ values, dimensions, size = 440, tone = "positive" }: RadarChartProps) {
    const gradientIdPrefix = useId().replace(/:/g, "");
    const points = dimensions.map((dimension, index) => pointFor(index, dimensions.length, values[dimension], tone));
    const pointColor = tone === "negative" ? "#ff7d90" : "#77d7ff";
    const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");
    const fillGradientId = `${gradientIdPrefix}-fill`;
    const glowFilterId = `${gradientIdPrefix}-glow`;
    const gradientTopColor = tone === "negative" ? "rgba(255, 168, 181, 0.45)" : "rgba(181, 236, 255, 0.45)";
    const gradientBottomColor = tone === "negative" ? "rgba(255, 125, 144, 0.08)" : "rgba(119, 215, 255, 0.08)";

    return (
        <svg className="radar-svg" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} width={size} height={size} role="img" aria-label="雷达图">
            <defs>
                <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={gradientTopColor} />
                    <stop offset="100%" stopColor={gradientBottomColor} />
                </linearGradient>
                <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={pointColor} floodOpacity="0.35" />
                </filter>
            </defs>
            {[1, 2, 3, 4, 5].map((step) => (
                <polygon
                    key={step}
                    points={dimensions
                        .map((_, index) => {
                            const point = pointFor(index, dimensions.length, step, tone);
                            return `${point.x},${point.y}`;
                        })
                        .join(" ")}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1"
                />
            ))}
            {dimensions.map((dimension, index) => {
                const endpoint = pointFor(index, dimensions.length, 5, tone);
                const labelPoint = pointFor(index, dimensions.length, 5, tone, radius + 10);
                const isLeftSide = labelPoint.x < center - 4;
                const isRightSide = labelPoint.x > center + 4;
                const textAnchor = isLeftSide ? "end" : isRightSide ? "start" : "middle";
                const labelDy = labelPoint.y < center - 4 ? "-8" : labelPoint.y > center + 4 ? "18" : "6";
                return (
                    <g key={dimension}>
                        <line
                            x1={center}
                            y1={center}
                            x2={endpoint.x}
                            y2={endpoint.y}
                            stroke="rgba(255,255,255,0.18)"
                            strokeWidth="1"
                        />
                        <text
                            x={labelPoint.x}
                            y={labelPoint.y}
                            fill={pointColor}
                            fontSize="15"
                            fontWeight="600"
                            textAnchor={textAnchor}
                            dy={labelDy}
                        >
                            {ratingLabelText[dimension]}
                        </text>
                    </g>
                );
            })}
            <polygon points={polygon} fill={`url(#${fillGradientId})`} stroke={pointColor} strokeWidth="2.4" filter={`url(#${glowFilterId})`} />
            {points.map((point, index) => {
                return (
                    <circle
                        key={dimensions[index]}
                        cx={point.x}
                        cy={point.y}
                        r="4.5"
                        fill="#f5fbff"
                        stroke={pointColor}
                        strokeWidth="2.4"
                    />
                );
            })}
        </svg>
    );
}
