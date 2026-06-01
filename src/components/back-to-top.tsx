"use client";

export function BackToTopButton() {
    return (
        <button
            className="back-to-top"
            type="button"
            aria-label="回到顶部"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
            ↑ TOP
        </button>
    );
}