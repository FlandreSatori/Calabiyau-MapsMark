"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import type { SimulationNodeDatum, Simulation } from "d3-force";
import { forceSimulation, forceX, forceY } from "d3-force";

import { averageRatings } from "@/lib/metrics";
import { resolveMapImageUrl } from "@/lib/format";
import { ratingLabelText, ratingLabels, type MapRecord, type RatingDimensions, type ReviewRecord } from "@/lib/types";

type MetricDashboardProps = {
    maps: MapRecord[];
    reviews: ReviewRecord[];
    initialSelected?: Array<keyof RatingDimensions>;
};

type MapMetric = {
    map: MapRecord;
    ratings: RatingDimensions;
    reviewCount: number;
};

const clampScore = (value: number) => Math.max(-5, Math.min(5, value));
const toPercent = (value: number) => ((clampScore(value) + 5) / 10) * 100;
const cardOffsets = [
    { x: 14, y: -66, side: "right" as const },
    { x: 14, y: 10, side: "right" as const },
    { x: -186, y: -66, side: "left" as const },
    { x: -186, y: 10, side: "left" as const },
    { x: 14, y: -132, side: "right" as const },
    { x: -186, y: -132, side: "left" as const }
];

const metricKeys = ratingLabels;

const sortByMetric = (left: MapMetric, right: MapMetric, metric: keyof RatingDimensions) => {
    const scoreGap = right.ratings[metric] - left.ratings[metric];
    if (scoreGap !== 0) {
        return scoreGap;
    }
    return right.reviewCount - left.reviewCount;
};

interface GraphNode extends SimulationNodeDatum {
    id: string;
    entry: MapMetric;
    targetX: number;
    targetY: number;
    width: number;
    height: number;
    is2D: boolean;
}

function forceRectCollide() {
    let nodes: GraphNode[];
    function force(alpha: number) {
        for (let i = 0, n = nodes.length; i < n; ++i) {
            const a = nodes[i];
            for (let j = i + 1; j < n; ++j) {
                const b = nodes[j];
                let dx = a.x! - b.x!;
                let dy = a.y! - b.y!;
                if (dx === 0 && dy === 0) {
                    dx = (Math.random() - 0.5) * 2;
                    dy = (Math.random() - 0.5) * 2;
                }
                const w = (a.width + b.width) * 0.75;
                const h = (a.height + b.height) * 0.75;

                if (Math.abs(dx) < w && Math.abs(dy) < h) {
                    const mw = w - Math.abs(dx);
                    const mh = h - Math.abs(dy);
                    let ldx = 0, ldy = 0;
                    if (mw < mh) {
                        ldx = Math.sign(dx) * (mw / 2);
                    } else {
                        ldy = Math.sign(dy) * (mh / 2);
                    }
                    a.x! += ldx * alpha * 2;
                    a.y! += ldy * alpha * 2;
                    b.x! -= ldx * alpha * 2;
                    b.y! -= ldy * alpha * 2;
                }
            }
        }
    }
    force.initialize = (_: any) => nodes = _;
    return force;
}

function forceMouse(mousePosRef: React.MutableRefObject<{ x: number, y: number } | null>) {
    let nodes: GraphNode[];
    function force(alpha: number) {
        if (!mousePosRef.current) return;
        const mx = mousePosRef.current.x;
        const my = mousePosRef.current.y;
        for (let i = 0, n = nodes.length; i < n; ++i) {
            const node = nodes[i];
            const dx = node.x! - mx;
            const dy = node.y! - my;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const repelRadius = 180;
            if (dist < repelRadius) {
                const power = ((repelRadius - dist) / repelRadius) * alpha * 25;
                node.vx! += (dx / dist) * power;
                node.vy! += (dy / dist) * power;
            }
        }
    }
    force.initialize = (_: any) => nodes = _;
    return force;
}

function ForceStage({ maps, xMetric, yMetric }: { maps: MapMetric[], xMetric: keyof RatingDimensions, yMetric?: keyof RatingDimensions }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mousePosRef = useRef<{ x: number, y: number } | null>(null);
    const simulationRef = useRef<Simulation<GraphNode, undefined> | null>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const nodesRef = useRef<GraphNode[]>([]);
    const is2D = !!yMetric;

    // Use a stabilized version of data to keep nodes if they exist
    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height });
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        const W = dimensions.width;
        const H = dimensions.height;
        if (W === 0 || H === 0) return;

        // Initialize or update nodes target
        const ordered = [...maps].sort((left, right) => sortByMetric(left, right, xMetric));

        const nextNodes = ordered.map((entry, i) => {
            const xVal = toPercent(entry.ratings[xMetric]);
            const yVal = yMetric ? toPercent(entry.ratings[yMetric]) : 50;

            const targetX = (xVal / 100) * (W - 48) + 24;
            const targetY = is2D
                ? ((100 - yVal) / 100) * (H - 48) + 24
                : H / 2;

            const angle = (i / ordered.length) * Math.PI * 2;
            const radius = Math.min(W, H) * 0.4;
            const initX = W / 2 + Math.cos(angle) * radius;
            const initY = H / 2 + Math.sin(angle) * radius;

            // Retain previous x/y if possible to avoid jump
            const existing = nodesRef.current.find(n => n.id === entry.map.id);
            return {
                id: entry.map.id,
                entry,
                targetX,
                targetY,
                width: 220,
                height: 80,
                is2D,
                x: existing?.x ?? initX + (Math.random() - 0.5) * 20,
                y: existing?.y ?? initY + (Math.random() - 0.5) * 20,
                vx: existing?.vx ?? 0,
                vy: existing?.vy ?? 0
            } as GraphNode;
        });

        nodesRef.current = nextNodes;

        if (simulationRef.current) {
            simulationRef.current.stop();
        }

        const sim = forceSimulation<GraphNode>(nodesRef.current)
            .alphaDecay(0.015)
            .force("targetX", forceX<GraphNode>(d => d.targetX).strength(d => d.is2D ? 0.08 : 0.04))
            .force("targetY", forceY<GraphNode>(d => d.targetY).strength(d => d.is2D ? 0.08 : 0.01))
            .force("collide", forceRectCollide())
            .force("mouse", forceMouse(mousePosRef))
            .on("tick", () => {
                nodesRef.current.forEach(node => {
                    const el = document.getElementById(`card-${node.id}`);
                    if (el && node.x != null && node.y != null) {
                        el.style.transform = `translate(-50%, -50%) translate(${node.x}px, ${node.y}px)`;
                    }
                    const line = document.getElementById(`line-${node.id}`);
                    if (line && node.x != null && node.y != null) {
                        line.setAttribute("x2", String(node.x));
                        line.setAttribute("y2", String(node.y));
                        // Dot follows targetX
                        line.setAttribute("x1", String(node.targetX));
                        line.setAttribute("y1", String(node.targetY));
                    }
                    const dot = document.getElementById(`dot-${node.id}`);
                    if (dot) {
                        dot.style.transform = `translate(-50%, -50%) translate(${node.targetX}px, ${node.targetY}px)`;
                    }
                });
            });

        simulationRef.current = sim;

        return () => { sim.stop(); };
    }, [maps, xMetric, yMetric, dimensions.width, dimensions.height, is2D]);

    const onMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mousePosRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        if (simulationRef.current && simulationRef.current.alpha() < 0.1) {
            simulationRef.current.alpha(0.1).restart();
        }
    };

    const onMouseLeave = () => {
        mousePosRef.current = null;
    };

    return (
        <div
            ref={containerRef}
            className={`metric-stage ${is2D ? 'metric-stage-double' : 'metric-stage-single'}`}
            style={{
                minHeight: is2D ? undefined : Math.max(420, maps.length * 64 + 72),
                aspectRatio: is2D ? '1 / 1' : undefined,
                position: 'relative'
            }}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
        >
            {is2D ? (
                <>
                    <div className="metric-plot-grid" aria-hidden="true" />
                    <div className="metric-axis metric-axis-x" aria-hidden="true" />
                    <div className="metric-axis metric-axis-y" aria-hidden="true" />
                    <div className="metric-axis-label metric-axis-label-bottom-left">{ratingLabelText[xMetric]}</div>
                    <div className="metric-axis-label metric-axis-label-top-left">{ratingLabelText[yMetric!]}</div>
                </>
            ) : (
                <div className="metric-axis metric-axis-horizontal" style={{ bottom: '50%' }} aria-hidden="true" />
            )}

            <div className="metric-axis-label metric-axis-label-left" style={{ bottom: is2D ? '4px' : 'calc(50% - 24px)' }}>-5</div>
            <div className="metric-axis-label metric-axis-label-center" style={{ bottom: is2D ? '4px' : 'calc(50% - 24px)' }}>0</div>
            <div className="metric-axis-label metric-axis-label-right" style={{ bottom: is2D ? '4px' : 'calc(50% - 24px)' }}>5</div>

            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <defs>
                    <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="rgba(119, 215, 255, 0.6)" />
                        <stop offset="100%" stopColor="rgba(119, 215, 255, 0.1)" />
                    </linearGradient>
                </defs>
                {maps.map((entry) => {
                    const isHovered = hoveredId === entry.map.id;
                    return (
                        <line
                            key={entry.map.id}
                            id={`line-${entry.map.id}`}
                            stroke={isHovered ? "rgba(119, 215, 255, 1)" : "url(#line-gradient)"}
                            strokeWidth={isHovered ? "3" : "1.5"}
                            strokeDasharray={isHovered ? "none" : "4 4"}
                            style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
                        />
                    );
                })}
            </svg>

            {maps.map((entry) => {
                const isHovered = hoveredId === entry.map.id;
                return (
                    <div key={entry.map.id} style={{ position: 'absolute', left: 0, top: 0, zIndex: isHovered ? 10 : 1 }}>
                        <span
                            id={`dot-${entry.map.id}`}
                            className="metric-scatter-dot"
                            style={{
                                position: 'absolute', left: 0, top: 0, margin: 0,
                                boxShadow: isHovered ? '0 0 0 12px rgba(119, 215, 255, 0.3)' : '',
                                backgroundColor: isHovered ? '#fff' : '',
                                transition: 'box-shadow 0.2s, background-color 0.2s'
                            }}
                        />
                        <Link
                            id={`card-${entry.map.id}`}
                            href={`/maps/${entry.map.id}`}
                            className="metric-scatter-card"
                            style={{
                                position: 'absolute',
                                left: 0, top: 0, margin: 0,
                                transform: 'translate(-50%, -50%)',
                                width: '220px', // explicit width matching rect collision
                                borderColor: isHovered ? 'rgba(119, 215, 255, 0.8)' : ''
                            }}
                            title={`${entry.map.name} · 点击查看详情`}
                            onMouseEnter={() => setHoveredId(entry.map.id)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                            <img
                                src={resolveMapImageUrl(entry.map.coverImage)}
                                alt={entry.map.name}
                                className="metric-node-cover"
                            />
                            <div className="metric-node-body">
                                <strong>{entry.map.name}</strong>
                                <span>{entry.map.type} · {entry.map.code}</span>
                                <span>
                                    {is2D
                                        ? `${ratingLabelText[xMetric]} ${entry.ratings[xMetric].toFixed(1)} / ${ratingLabelText[yMetric!]} ${entry.ratings[yMetric!].toFixed(1)}`
                                        : `${ratingLabelText[xMetric]}：${entry.ratings[xMetric].toFixed(1)}`
                                    }
                                </span>
                            </div>
                        </Link>
                    </div>
                );
            })}
        </div>
    );
}

export function MetricDashboard({ maps, reviews, initialSelected = ["overall"] }: MetricDashboardProps) {
    const [xMetric, setXMetric] = useState<keyof RatingDimensions>(initialSelected[0] || "overall");
    const [yMetric, setYMetric] = useState<keyof RatingDimensions | "none">(initialSelected[1] || "none");
    const [disabledMapIds, setDisabledMapIds] = useState<Set<string>>(new Set());
    const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("All");

    const mapTypes = useMemo(() => Array.from(new Set(maps.map(m => m.type))), [maps]);

    const mapMetrics = useMemo<MapMetric[]>(() => {
        return maps
            .filter((map) => !disabledMapIds.has(map.id))
            .map((map) => {
                const mapReviews = reviews.filter((review) => review.mapId === map.id && !review.deletedAt);
                return {
                    map,
                    ratings: averageRatings(reviews, map.id),
                    reviewCount: mapReviews.length
                };
            });
    }, [maps, reviews, disabledMapIds]);

    const toggleMap = (id: string) => {
        setDisabledMapIds((current) => {
            const next = new Set(current);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    return (
        <div className="metric-explorer">
            <div className="metric-controls">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    <div>
                        <p className="section-title">横轴维度 (必选)</p>
                        <div className="metric-choice-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            {metricKeys.map((key) => {
                                const isSelected = xMetric === key;
                                return (
                                    <label className={`metric-choice${isSelected ? " is-selected" : ""}`} key={`x-${key}`}>
                                        <input checked={isSelected} onChange={() => setXMetric(key)} type="radio" name="xMetric" />
                                        <span>{ratingLabelText[key]}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <p className="section-title">纵轴维度 (可选)</p>
                        <div className="metric-choice-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            <label className={`metric-choice${yMetric === "none" ? " is-selected" : ""}`}>
                                <input checked={yMetric === "none"} onChange={() => setYMetric("none")} type="radio" name="yMetric" />
                                <span>不展示 (一维)</span>
                            </label>
                            {metricKeys.map((key) => {
                                const isSelected = yMetric === key;
                                // Can't be same as X
                                const disabled = xMetric === key;
                                return (
                                    <label className={`metric-choice${isSelected ? " is-selected" : ""}${disabled ? " is-disabled" : ""}`} key={`y-${key}`}>
                                        <input checked={isSelected} disabled={disabled} onChange={() => setYMetric(key)} type="radio" name="yMetric" />
                                        <span>{ratingLabelText[key]}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p className="section-title" style={{ margin: 0 }}>参与比较的地图</p>
                        <select
                            className="select"
                            style={{ width: 'auto', padding: '6px 16px', fontSize: '0.9rem', borderRadius: '12px', minWidth: '160px' }}
                            value={selectedTypeFilter}
                            onChange={(e) => setSelectedTypeFilter(e.target.value)}
                        >
                            <option value="All">所有类型</option>
                            {mapTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div style={{
                        marginTop: 14,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                        gap: '12px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        paddingRight: '6px',
                        paddingBottom: '8px'
                    }}>
                        {maps.filter(m => selectedTypeFilter === "All" || m.type === selectedTypeFilter).map((map) => {
                            const isSelected = !disabledMapIds.has(map.id);
                            return (
                                <div
                                    key={map.id}
                                    onClick={() => toggleMap(map.id)}
                                    title={map.name}
                                    style={{
                                        position: 'relative',
                                        aspectRatio: '16 / 9',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        opacity: isSelected ? 1 : 0.4,
                                        border: isSelected ? '2px solid rgba(119, 215, 255, 0.8)' : '1px solid rgba(255, 255, 255, 0.08)',
                                        boxShadow: isSelected ? '0 4px 12px rgba(119, 215, 255, 0.2)' : 'none',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <img
                                        src={resolveMapImageUrl(map.coverImage)}
                                        alt={map.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'linear-gradient(180deg, transparent 30%, rgba(3, 8, 17, 0.85) 100%)',
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        padding: '6px'
                                    }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                                            {map.name}
                                        </span>
                                    </div>
                                    {isSelected && (
                                        <div style={{ position: 'absolute', top: 4, right: 6, color: '#77d7ff', fontSize: '0.85rem', fontWeight: '900', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                                            ✓
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <ForceStage
                maps={mapMetrics}
                xMetric={xMetric}
                yMetric={yMetric !== "none" ? yMetric : undefined}
            />
        </div>
    );
}
