"use client";

import React, { useEffect, useState } from "react";

type Toast = { id: number; status: "success" | "error" | "info"; title: string; message?: string };

let nextId = 1;
const listeners: Array<(t: Toast) => void> = [];

export function notify(status: Toast["status"], title: string, message?: string) {
    const t: Toast = { id: nextId++, status, title, message };
    listeners.forEach((l) => l(t));
    return t.id;
}

export default function Toasts() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const l = (t: Toast) => setToasts((s) => [t, ...s]);
        listeners.push(l);
        return () => {
            const idx = listeners.indexOf(l);
            if (idx >= 0) listeners.splice(idx, 1);
        };
    }, []);

    useEffect(() => {
        if (toasts.length === 0) return;
        const timers = toasts.map((t) =>
            setTimeout(() => setToasts((s) => s.filter((x) => x.id !== t.id)), 4500)
        );
        return () => timers.forEach((x) => clearTimeout(x));
        // we intentionally only depend on toasts to schedule removals
    }, [toasts]);

    return (
        <div className="toast-wrapper" aria-live="polite">
            {toasts.map((t) => (
                <div key={t.id} className={`toast ${t.status}`}>
                    <div className="toast-title">{t.title}</div>
                    {t.message ? <div className="toast-message">{t.message}</div> : null}
                </div>
            ))}
            <style jsx>{`
                .toast-wrapper {
                    position: fixed;
                    right: 18px;
                    bottom: 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    z-index: 9999;
                    pointer-events: none;
                }
                .toast {
                    min-width: 220px;
                    max-width: 380px;
                    background: rgba(0,0,0,0.72);
                    color: #fff;
                    border-radius: 10px;
                    padding: 10px 12px;
                    box-shadow: 0 6px 18px rgba(0,0,0,0.4);
                    pointer-events: auto;
                    backdrop-filter: blur(6px);
                }
                .toast.success { border-left: 4px solid rgba(120,200,120,0.9); }
                .toast.error { border-left: 4px solid rgba(240,120,120,0.95); }
                .toast.info { border-left: 4px solid rgba(120,160,240,0.9); }
                .toast-title { font-weight: 700; margin-bottom: 4px; }
                .toast-message { font-size: 0.92rem; opacity: 0.95; }
            `}</style>
        </div>
    );
}
