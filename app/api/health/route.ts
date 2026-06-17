import { NextResponse } from "next/server";
import { getRuntimeStatus } from "@/lib/runtime-status";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(getRuntimeStatus(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

