import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const token = request.headers.get("x-admin-token") ?? "";
    const expected = process.env.ADMIN_TOKEN ?? "";

    if (!expected || token.length === 0 || token !== expected) {
        return NextResponse.json({ authenticated: false, message: "管理员令牌无效" }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true }, { status: 200 });
}