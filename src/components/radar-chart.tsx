"use client";

import type { RatingDimensions } from "@/lib/types";
import { ratingLabelText } from "@/lib/types";

type RadarChartProps = {
    values: RatingDimensions;
    dimensions: Array<keyof RatingDimensions>;
    size?: number;
};

const viewBoxSize = 440;
const center = viewBoxSize / 2;
const radius = 150;

const pointFor = (index: number, total: number, value: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const distance = radius * (value / 5);
    return {
        x: center + Math.cos(angle) * distance,
        y: center + Math.sin(angle) * distance
    };
};

export function RadarChart({ values, dimensions, size = 440 }: RadarChartProps) {
    const points = dimensions.map((dimension, index) => pointFor(index, dimensions.length, values[dimension]));
    const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");

    return (
        <svg className="radar-svg" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} width={size} height={size} role="img" aria-label="雷达图">
            <defs>
                <linearGradient id="radar-fill" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgba(119, 215, 255, 0.85)" />
                    <stop offset="100%" stopColor="rgba(76, 195, 255, 0.25)" />
                </linearGradient>
            </defs>
            {[1, 2, 3, 4, 5].map((step) => (
                <polygon
                    key={step}
                    points={dimensions
                        .map((_, index) => {
                            const point = pointFor(index, dimensions.length, step);
                            return `${point.x},${point.y}`;
                        })
                        .join(" ")}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1"
                />
            ))}
            {dimensions.map((dimension, index) => {
                const endpoint = pointFor(index, dimensions.length, 5);
                return (
                    <g key={dimension}>
                        <line x1={center} y1={center} x2={endpoint.x} y2={endpoint.y} stroke="rgba(255,255,255,0.12)" strokeWidth="1.4" />
                        <text x={endpoint.x} y={endpoint.y} fill="#dbe8ff" fontSize="14" textAnchor="middle" dy="-8">
                            {ratingLabelText[dimension]}
                        </text>
                    </g>
                );
            })}
            <polygon points={polygon} fill="url(#radar-fill)" stroke="#77d7ff" strokeWidth="2.2" opacity="0.96" />
            {points.map((point, index) => (
                <circle key={dimensions[index]} cx={point.x} cy={point.y} r="4.5" fill="#fff" stroke="#77d7ff" strokeWidth="2" />
            ))}
        </svg>
    );
}
