import { NextResponse } from "next/server";
import { bootstrapAdminClaim } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await bootstrapAdminClaim(request);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to bootstrap admin access.";
    const status =
      message.includes("Missing Firebase ID token") ||
      message.includes("verified Super Admin")
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
