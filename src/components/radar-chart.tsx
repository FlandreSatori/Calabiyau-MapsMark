"use client";

import { useId } from "react";

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
const positiveColorLow = { red: 190, green: 228, blue: 255 };
const positiveColorHigh = { red: 104, green: 205, blue: 255 };

const clampScore = (value: number) => Math.max(-5, Math.min(5, value));

const colorForDiverging = (value: number) => {
    const t = (clampScore(value) + 5) / 10;
    const red = Math.round(negativeColor.red + (positiveColor.red - negativeColor.red) * t);
    const green = Math.round(negativeColor.green + (positiveColor.green - negativeColor.green) * t);
    const blue = Math.round(negativeColor.blue + (positiveColor.blue - negativeColor.blue) * t);
    return `rgb(${red} ${green} ${blue})`;
};

const colorForPositive = (value: number) => {
    const normalized = Math.max(0, clampScore(value)) / 5;
    const red = Math.round(positiveColorLow.red + (positiveColorHigh.red - positiveColorLow.red) * normalized);
    const green = Math.round(positiveColorLow.green + (positiveColorHigh.green - positiveColorLow.green) * normalized);
    const blue = Math.round(positiveColorLow.blue + (positiveColorHigh.blue - positiveColorLow.blue) * normalized);
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
    const gradientIdPrefix = useId().replace(/:/g, "");
    const hasNegative = dimensions.some((dimension) => values[dimension] < 0);
    const points = dimensions.map((dimension, index) => pointFor(index, dimensions.length, values[dimension]));
    const pointColors = dimensions.map((dimension) => {
        const value = values[dimension];
        return hasNegative ? colorForDiverging(value) : colorForPositive(value);
    });
    const edgeGradients = points.map((point, index) => {
        const nextPoint = points[(index + 1) % points.length];
        return {
            id: `${gradientIdPrefix}-edge-${index}`,
            x1: point.x,
            y1: point.y,
            x2: nextPoint.x,
            y2: nextPoint.y,
            startColor: pointColors[index],
            endColor: pointColors[(index + 1) % pointColors.length]
        };
    });
    const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");
    const polygonFill = hasNegative ? "rgba(119, 215, 255, 0.18)" : "url(#radar-fill-positive)";

    return (
        <svg className="radar-svg" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} width={size} height={size} role="img" aria-label="雷达图">
            <defs>
                <linearGradient id="radar-fill-positive" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgba(119, 215, 255, 0.85)" />
                    <stop offset="100%" stopColor="rgba(76, 195, 255, 0.25)" />
                </linearGradient>
                {edgeGradients.map((edge) => (
                    <linearGradient key={edge.id} id={edge.id} gradientUnits="userSpaceOnUse" x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}>
                        <stop offset="0%" stopColor={edge.startColor} />
                        <stop offset="100%" stopColor={edge.endColor} />
                    </linearGradient>
                ))}
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
                const axisColor = pointColors[index];
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
            <polygon points={polygon} fill={polygonFill} stroke="none" opacity="0.96" />
            {points.map((point, index) => {
                const nextPoint = points[(index + 1) % points.length];
                const edge = edgeGradients[index];
                return (
                    <line
                        key={edge.id}
                        x1={point.x}
                        y1={point.y}
                        x2={nextPoint.x}
                        y2={nextPoint.y}
                        stroke={`url(#${edge.id})`}
                        strokeWidth="2.2"
                    />
                );
            })}
            {points.map((point, index) => {
                const pointColor = pointColors[index];
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
