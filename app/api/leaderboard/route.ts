// app/api/leaderboard/route.ts
import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

const LB = "zset:bananas";
export const runtime = "edge";

export async function GET() {
    const raw = await redis.zrange<string[]>(LB, 0, 19, { rev: true, withScores: true });

    const rows: { userId: string; score: number }[] = [];
    for (let i = 0; i < raw.length; i += 2) {
        rows.push({ userId: String(raw[i]), score: Number(raw[i + 1]) });
    }

    return NextResponse.json({ rows });
}
