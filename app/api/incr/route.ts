// app/api/incr/route.ts
import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

const GLOBAL = "counter:bananas";
const LB = "zset:bananas";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { userId, amount = 1 } = await req.json();
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    const amt = Number(amount) || 1;
    const userKey = `user:${userId}:bananas`;

    const [total, userTotal] = await Promise.all([
      redis.incrby(GLOBAL, amt),
      redis.incrby(userKey, amt),
    ]);

    const newScore = await redis.zincrby(LB, amt, userId);
    return NextResponse.json({ total, userTotal, newScore });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "fail" }, { status: 500 });
  }
}
