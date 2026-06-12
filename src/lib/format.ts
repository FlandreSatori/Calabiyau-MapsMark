const displayTimeZone = "Asia/Shanghai";

export const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat("zh-CN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: displayTimeZone
    }).format(new Date(value));

export const formatDate = (value: string) =>
    Number.isNaN(new Date(value).getTime())
        ? "无日期"
        : new Intl.DateTimeFormat("zh-CN", {
            dateStyle: "medium",
            timeZone: displayTimeZone
        }).format(new Date(value));

export const clampScore = (value: number) => Math.max(-5, Math.min(5, Math.round(value * 10) / 10));

export const resolveMapImageUrl = (url?: string) => {
    if (!url) return url;
    const trimmed = url.trim();
    if (!trimmed) return "";

    if (
        trimmed.startsWith("/") ||
        trimmed.startsWith("./") ||
        trimmed.startsWith("../") ||
        trimmed.startsWith("data:") ||
        trimmed.startsWith("blob:")
    ) {
        return trimmed;
    }

    const marker = "/assets/images/";
    const markerIndex = trimmed.indexOf(marker);
    if (markerIndex >= 0) {
        const filePart = trimmed.slice(markerIndex + marker.length).split("?")[0].split("#")[0];
        if (filePart) {
            return `/assets/images/${filePart}`;
        }
    }

    return trimmed;
};


