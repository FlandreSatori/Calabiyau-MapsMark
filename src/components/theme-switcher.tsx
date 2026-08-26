"use client";

import { useEffect } from "react";

const storageKey = "mapsmark-theme";

export function ThemeSwitcher() {
    useEffect(() => {
        window.localStorage.setItem(storageKey, "default");
        document.documentElement.dataset.theme = "default";
    }, []);

    return (
        <label className="theme-switcher">
            <span className="sr-only">选择主题</span>
            <select value="default" aria-label="选择主题" disabled>
                <option value="default">默认主题</option>
            </select>
        </label>
    );
}
