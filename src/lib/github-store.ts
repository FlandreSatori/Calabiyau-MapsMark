import type { AppState, EventRecord, MapInput, MapRecord, ReviewInput, ReviewRecord } from "@/lib/types";
import { seedState } from "@/lib/seed";
import { readFile } from "node:fs/promises";
import path from "node:path";

const defaultState = () => structuredClone(seedState);

const githubConfig = () => ({
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    branch: process.env.GITHUB_BRANCH ?? "main",
    dataPath: process.env.GITHUB_DATA_PATH ?? "data/mapsmark.json",
    token: process.env.GITHUB_TOKEN
});

const hasGitHubConfig = () => {
    const config = githubConfig();
    return Boolean(config.owner && config.repo);
};

const requireGitHubConfig = () => {
    const config = githubConfig();
    const missing = [
        !config.owner ? "GITHUB_OWNER" : "",
        !config.repo ? "GITHUB_REPO" : "",
        !config.token ? "GITHUB_TOKEN" : ""
    ].filter(Boolean);

    if (missing.length > 0) {
        throw new Error(`Missing GitHub environment variables: ${missing.join(", ")}`);
    }

    return config as Required<ReturnType<typeof githubConfig>>;
};

const contentsUrl = () => {
    const config = githubConfig();
    return `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.dataPath}?ref=${config.branch}`;
};

const rawUrl = () => {
    const config = githubConfig();
    return `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${config.dataPath}`;
};

const authHeaders = () => {
    const config = githubConfig();
    const headers: Record<string, string> = {};
    if (config.token) {
        headers.Authorization = `Bearer ${config.token}`;
    }
    return headers;
};

const decodeContent = (content: string) => {
    const json = Buffer.from(content.replace(/\n/g, ""), "base64").toString("utf8");
    return JSON.parse(json) as AppState;
};

const encodeContent = (state: AppState) => {
    const json = JSON.stringify(state, null, 2);
    return Buffer.from(json, "utf8").toString("base64");
};

const responseToState = async (response: Response) => {
    if (!response.ok) {
        throw new Error(`GitHub storage error: ${response.status}`);
    }
    const payload = (await response.json()) as { content?: string; sha?: string };
    if (!payload.content) {
        throw new Error("GitHub storage returned no content");
    }
    return {
        state: decodeContent(payload.content),
        sha: payload.sha
    };
};


const loadLocalStateFile = async (): Promise<AppState | null> => {
    try {
        const filePath = path.join(process.cwd(), "data", "mapsmark.json");
        const text = await readFile(filePath, "utf8");
        return JSON.parse(text) as AppState;
    } catch (error) {
        return null;
    }
};
const loadStateWithCache = async (cache: RequestCache): Promise<AppState> => {
    if (!hasGitHubConfig()) {
        return (await loadLocalStateFile()) ?? defaultState();
    }

    const headers: Record<string, string> = {
        Accept: "application/vnd.github.object+json",
        ...authHeaders()
    };

    const response = await fetch(hasGitHubConfig() ? contentsUrl() : rawUrl(), {
        headers,
        cache
    });

    if (response.status === 404) {
        return (await loadLocalStateFile()) ?? defaultState();
    }

    if (!response.ok) {
        const rawResponse = await fetch(rawUrl(), { cache });
        if (!rawResponse.ok) {
            return (await loadLocalStateFile()) ?? defaultState();
        }
        return (await rawResponse.json()) as AppState;
    }

    return responseToState(response).then(({ state }) => state);
};

export const loadState = async (): Promise<AppState> => {
    return loadStateWithCache("no-store");
};

export const loadStateStatic = async (): Promise<AppState> => loadStateWithCache("force-cache");

export const saveState = async (state: AppState) => {
    const config = requireGitHubConfig();
    const headers: Record<string, string> = {
        Accept: "application/vnd.github.object+json",
        ...authHeaders()
    };
    const currentResponse = await fetch(contentsUrl(), {
        headers,
        cache: "no-store"
    });

    let sha: string | undefined;
    if (currentResponse.ok) {
        const current = (await currentResponse.json()) as { sha?: string };
        sha = current.sha;
    }

    const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.dataPath}`, {
        method: "PUT",
        headers: {
            ...authHeaders(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: `Update MapsMark data at ${new Date().toISOString()}`,
            content: encodeContent(state),
            branch: config.branch,
            ...(sha ? { sha } : {})
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to save state: ${response.status}`);
    }

    return state;
};

const nextId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const normalizeMappedAt = (value: unknown) => {
    if (typeof value !== "string" || !value.trim()) {
        return "";
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "" : value;
};

const appendEvent = (state: AppState, event: Omit<EventRecord, "id" | "timestamp">) => {
    state.events.unshift({
        ...event,
        id: nextId("event"),
        timestamp: new Date().toISOString()
    });
    state.updatedAt = new Date().toISOString();
};

export const addMap = async (input: MapInput) => {
    const state = await loadState();
    const now = new Date().toISOString();
    const record: MapRecord = {
        ...input,
        mappedAt: normalizeMappedAt(input.mappedAt),
        id: nextId("map"),
        submittedAt: now,
        updatedAt: now
    };
    state.maps.unshift(record);
    appendEvent(state, {
        kind: "map-create",
        subjectId: record.id,
        title: `发布地图 ${record.name}`,
        detail: record.code
    });
    await saveState(state);
    return state;
};

export const addReview = async (input: ReviewInput) => {
    const state = await loadState();
    const now = new Date().toISOString();
    const record: ReviewRecord = {
        ...input,
        id: nextId("review"),
        submittedAt: now,
        updatedAt: now
    };
    state.reviews.unshift(record);
    appendEvent(state, {
        kind: "review-create",
        subjectId: record.id,
        title: `新增评价 ${record.anonymous ? "匿名" : record.reviewerName}`,
        detail: record.mapId
    });
    await saveState(state);
    return state;
};

export const patchMap = async (id: string, patch: Partial<MapInput>) => {
    const state = await loadState();
    const target = state.maps.find((item) => item.id === id);
    if (!target) {
        throw new Error("Map not found");
    }
    Object.assign(target, patch, {
        mappedAt: patch.mappedAt !== undefined ? normalizeMappedAt(patch.mappedAt) : target.mappedAt,
        updatedAt: new Date().toISOString()
    });
    appendEvent(state, {
        kind: "map-update",
        subjectId: target.id,
        title: `编辑地图 ${target.name}`,
        detail: target.code
    });
    await saveState(state);
    return state;
};

export const removeMap = async (id: string) => {
    const state = await loadState();
    const target = state.maps.find((item) => item.id === id);
    if (!target) {
        throw new Error("Map not found");
    }
    target.deletedAt = new Date().toISOString();
    target.updatedAt = target.deletedAt;
    appendEvent(state, {
        kind: "map-delete",
        subjectId: target.id,
        title: `删除地图 ${target.name}`,
        detail: target.code
    });
    await saveState(state);
    return state;
};

export const patchReview = async (id: string, patch: Partial<ReviewInput>) => {
    const state = await loadState();
    const target = state.reviews.find((item) => item.id === id);
    if (!target) {
        throw new Error("Review not found");
    }
    Object.assign(target, patch, { updatedAt: new Date().toISOString() });
    appendEvent(state, {
        kind: "review-update",
        subjectId: target.id,
        title: `编辑评价 ${target.anonymous ? "匿名" : target.reviewerName}`,
        detail: target.mapId
    });
    await saveState(state);
    return state;
};

export const removeReview = async (id: string) => {
    const state = await loadState();
    const target = state.reviews.find((item) => item.id === id);
    if (!target) {
        throw new Error("Review not found");
    }
    target.deletedAt = new Date().toISOString();
    target.updatedAt = target.deletedAt;
    appendEvent(state, {
        kind: "review-delete",
        subjectId: target.id,
        title: `删除评价 ${target.anonymous ? "匿名" : target.reviewerName}`,
        detail: target.mapId
    });
    await saveState(state);
    return state;
};

export const patchUI = async (background: string) => {
    const state = await loadState();
    state.ui = state.ui || {};
    state.ui.background = background;
    appendEvent(state, {
        kind: "map-update",
        subjectId: "ui",
        title: `更新 UI 背景`,
        detail: background
    });
    await saveState(state);
    return state;
};
