"use client";

import { useMemo, useState } from "react";

import { RadarChart } from "@/components/radar-chart";
import { ratingLabelText, ratingLabels } from "@/lib/types";
import type { RatingDimensions } from "@/lib/types";

type MetricDashboardProps = {
    values: RatingDimensions;
};

export function MetricDashboard({ values }: MetricDashboardProps) {
    const [selected, setSelected] = useState<Array<keyof RatingDimensions>>(["entertainment", "aesthetics"]);

    const dimensions = useMemo(() => {
        if (selected.length < 2) {
            return ["entertainment", "aesthetics"] as Array<keyof RatingDimensions>;
        }
        return selected;
    }, [selected]);

    const toggle = (key: keyof RatingDimensions) => {
        setSelected((current) => {
            if (current.includes(key)) {
                if (current.length <= 2) {
                    return current;
                }
                return current.filter((item) => item !== key);
            }
            return [...current, key];
        });
    };

    return (
        <div className="radar-wrap">
            <div>
                <RadarChart values={values} dimensions={dimensions} size={420} />
            </div>
            <div className="legend-grid">
                <p className="help">至少勾选两个维度。你也可以一次比较 3 到 5 个维度。</p>
                {ratingLabels.map((key) => (
                    <label className="legend-row" key={key} style={{ cursor: "pointer" }}>
                        <span>
                            <input checked={selected.includes(key)} onChange={() => toggle(key)} type="checkbox" /> {ratingLabelText[key]}
                        </span>
                        <strong>{values[key].toFixed(1)}</strong>
                    </label>
                ))}
            </div>
        </div>
    );
}
