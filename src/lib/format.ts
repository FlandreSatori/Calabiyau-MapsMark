export const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat("zh-CN", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(new Date(value));

export const formatDate = (value: string) =>
    new Intl.DateTimeFormat("zh-CN", {
        dateStyle: "medium"
    }).format(new Date(value));

export const clampScore = (value: number) => Math.max(-5, Math.min(5, Math.round(value * 10) / 10));
