import { NextResponse } from "next/server";

import { addMap, addReview, loadState, patchMap, patchReview, removeMap, removeReview } from "@/lib/github-store";

const adminAllowed = (request: Request) => {
    const token = request.headers.get("x-admin-token") ?? "";
    return Boolean(process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN);
};

export async function GET() {
    const state = await loadState();
    return NextResponse.json(state, { status: 200 });
}

export async function POST(request: Request) {
    const body = (await request.json()) as { type: "map" | "review"; payload: unknown };
    if (body.type === "map") {
        const state = await addMap(body.payload as Parameters<typeof addMap>[0]);
        return NextResponse.json(state, { status: 201 });
    }
    const state = await addReview(body.payload as Parameters<typeof addReview>[0]);
    return NextResponse.json(state, { status: 201 });
}

export async function PATCH(request: Request) {
    if (!adminAllowed(request)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = (await request.json()) as { type: "map" | "review"; id: string; patch: unknown };
    if (body.type === "map") {
        const state = await patchMap(body.id, body.patch as Parameters<typeof patchMap>[1]);
        return NextResponse.json(state, { status: 200 });
    }
    const state = await patchReview(body.id, body.patch as Parameters<typeof patchReview>[1]);
    return NextResponse.json(state, { status: 200 });
}

export async function DELETE(request: Request) {
    if (!adminAllowed(request)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = (await request.json()) as { type: "map" | "review"; id: string };
    if (body.type === "map") {
        const state = await removeMap(body.id);
        return NextResponse.json(state, { status: 200 });
    }
    const state = await removeReview(body.id);
    return NextResponse.json(state, { status: 200 });
}
