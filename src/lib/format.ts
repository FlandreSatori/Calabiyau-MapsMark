export const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat("zh-CN", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(new Date(value));

export const formatDate = (value: string) =>
    Number.isNaN(new Date(value).getTime())
        ? "无日期"
        : new Intl.DateTimeFormat("zh-CN", {
            dateStyle: "medium"
        }).format(new Date(value));

export const clampScore = (value: number) => Math.max(-5, Math.min(5, Math.round(value * 10) / 10));

export const getProxiedGithubUrl = (url?: string) => {
    if (!url) return url;
    if (url.includes("github.com") || url.includes("raw.githubusercontent.com")) {
        // Hydration safe in React: when running on client, check if domestic
        if (typeof navigator !== "undefined" && navigator.language.startsWith("zh")) {
            return `https://gh.llkk.cc/${url}`;
        }
    }
    return url;
};

