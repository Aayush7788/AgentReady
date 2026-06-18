import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getCronSecret } from "@/lib/env";
import { runDataMaintenance } from "@/lib/maintenance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request, secret: string): boolean {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return false;

  const provided = authorization.slice("Bearer ".length);
  const expectedBuffer = Buffer.from(secret);
  const providedBuffer = Buffer.from(provided);
  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}

export async function GET(request: Request) {
  const secret = getCronSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "setup_required", message: "Maintenance is not configured." },
      { status: 503 },
    );
  }
  if (!isAuthorized(request, secret)) {
    return NextResponse.json(
      { error: "unauthorized", message: "Authorization is required." },
      { status: 401 },
    );
  }

  try {
    const removed = await runDataMaintenance();
    return NextResponse.json({
      status: "complete",
      removed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "[maintenance] cleanup failed",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "cleanup_failed", message: "Maintenance did not complete." },
      { status: 500 },
    );
  }
}
