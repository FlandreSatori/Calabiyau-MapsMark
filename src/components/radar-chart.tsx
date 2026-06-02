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

const negativeColor = { red: 255, green: 95, blue: 121 };
const positiveColor = { red: 119, green: 215, blue: 255 };

const clampScore = (value: number) => Math.max(-5, Math.min(5, value));

const colorForValue = (value: number) => {
    const t = (clampScore(value) + 5) / 10;
    const red = Math.round(negativeColor.red + (positiveColor.red - negativeColor.red) * t);
    const green = Math.round(negativeColor.green + (positiveColor.green - negativeColor.green) * t);
    const blue = Math.round(negativeColor.blue + (positiveColor.blue - negativeColor.blue) * t);
    return `rgb(${red} ${green} ${blue})`;
};

const pointFor = (index: number, total: number, value: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const distance = radius * (Math.abs(clampScore(value)) / 5);
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
                <linearGradient id="radar-fill" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(255, 95, 121, 0.42)" />
                    <stop offset="50%" stopColor="rgba(232, 171, 205, 0.26)" />
                    <stop offset="100%" stopColor="rgba(119, 215, 255, 0.34)" />
                </linearGradient>
                <linearGradient id="radar-stroke" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(255, 95, 121, 0.92)" />
                    <stop offset="50%" stopColor="rgba(232, 171, 205, 0.88)" />
                    <stop offset="100%" stopColor="rgba(119, 215, 255, 0.92)" />
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
                const value = values[dimension];
                const axisColor = colorForValue(value);
                return (
                    <g key={dimension}>
                        <line
                            x1={center}
                            y1={center}
                            x2={endpoint.x}
                            y2={endpoint.y}
                            stroke={axisColor}
                            strokeWidth="1.4"
                        />
                        <text
                            x={endpoint.x}
                            y={endpoint.y}
                            fill={axisColor}
                            fontSize="14"
                            textAnchor="middle"
                            dy="-8"
                        >
                            {ratingLabelText[dimension]}
                        </text>
                    </g>
                );
            })}
            <polygon points={polygon} fill="url(#radar-fill)" stroke="url(#radar-stroke)" strokeWidth="2.2" opacity="0.96" />
            {points.map((point, index) => {
                const value = values[dimensions[index]];
                const pointColor = colorForValue(value);
                return (
                    <circle
                        key={dimensions[index]}
                        cx={point.x}
                        cy={point.y}
                        r="4.5"
                        fill={pointColor}
                        stroke={pointColor}
                        strokeWidth="2"
                    />
                );
            })}
        </svg>
    );
}
