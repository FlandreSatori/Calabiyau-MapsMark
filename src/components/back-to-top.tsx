"use client";

export function BackToTopButton() {
    return (
        <button
            className="back-to-top"
            type="button"
            aria-label="回到顶部"
            title="回到顶部"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
                <path
                    d="M8 13V3.6M8 3.6L3.4 8.2M8 3.6l4.6 4.6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    );
}