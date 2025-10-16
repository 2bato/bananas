// app/api/stats/route.ts
import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

const GLOBAL = "counter:bananas";
export const runtime = "edge";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ total: 0, userTotal: 0 });

    const total = await redis.get<number>(GLOBAL);
    const userTotal = await redis.get<number>(`user:${userId}:bananas`);

    return NextResponse.json({
        total: Number(total ?? 0),
        userTotal: Number(userTotal ?? 0),
    });
}
