import { NextResponse } from "next/server";

const githubConfig = () => ({
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    branch: process.env.GITHUB_BRANCH ?? "main",
    token: process.env.GITHUB_TOKEN,
    basePath: process.env.GITHUB_DATA_PATH ? process.env.GITHUB_DATA_PATH.replace(/\/data\/mapsmark.json$/, "") : ""
});

export async function POST(request: Request) {
    try {
        const config = githubConfig();
        if (!config.owner || !config.repo || !config.token) {
            return NextResponse.json({ message: "Missing GitHub config" }, { status: 500 });
        }

        const body = (await request.json()) as { filename: string; contentBase64: string; contentType?: string };
        if (!body || !body.filename || !body.contentBase64) {
            return NextResponse.json({ message: "Invalid upload payload" }, { status: 400 });
        }

        const path = `assets/images/${Date.now()}-${body.filename}`;
        const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;

        const res = await fetch(url, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${config.token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `Upload image ${body.filename} via MapsMark at ${new Date().toISOString()}`,
                content: body.contentBase64,
                branch: config.branch
            })
        });

        const text = await res.text();
        let payload: any = null;
        try {
            payload = JSON.parse(text);
        } catch (e) {
            payload = null;
        }

        if (!res.ok) {
            if (res.status === 401) {
                return NextResponse.json(
                    {
                        message: "GitHub token 无效或已失效，请重新生成 PAT，并确认仓库授权与 SSO 已批准。",
                        detail: payload ?? { message: text }
                    },
                    { status: 401 }
                );
            }
            if (res.status === 403) {
                return NextResponse.json(
                    {
                        message: "GitHub token 没有该仓库的写权限，或需要先批准 SSO。请确认 Contents: Read & write，并把仓库加入 Repository access。",
                        detail: payload ?? { message: text }
                    },
                    { status: 403 }
                );
            }
            return NextResponse.json({ message: payload?.message ?? `GitHub upload failed (${res.status})`, detail: payload }, { status: 500 });
        }

        // Try to return download_url if available
        const downloadUrl = payload?.content?.download_url ?? `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${path}`;
        return NextResponse.json({ url: downloadUrl }, { status: 201 });
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error("/api/upload error:", err);
        return NextResponse.json({ message: (err as Error).message ?? "Unknown error" }, { status: 500 });
    }
}
