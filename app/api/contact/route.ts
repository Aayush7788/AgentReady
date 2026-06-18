import { NextResponse } from "next/server";
import { parseContactRequest } from "@/lib/contact";
import { getSupabaseStatus } from "@/lib/env";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createContactRequest } from "@/lib/supabase";

export const runtime = "nodejs";

const RATE_LIMIT = 3;
const RATE_WINDOW_SECONDS = 60 * 60;

export async function POST(request: Request) {
  let rateLimit;
  try {
    rateLimit = await enforceRateLimit(
      request,
      "contact_request",
      RATE_LIMIT,
      RATE_WINDOW_SECONDS,
    );
  } catch (error) {
    console.error(
      "[contact] durable rate limit unavailable",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      {
        error: "contact_unavailable",
        message:
          "The request could not be accepted. Email aayushkotadia76@gmail.com directly.",
      },
      { status: 503 },
    );
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: "Too many requests. Try again in one hour.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(
              1,
              Math.ceil(
                (new Date(rateLimit.resetAt).getTime() - Date.now()) / 1_000,
              ),
            ),
          ),
        },
      },
    );
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Request body must be JSON." },
      { status: 400 },
    );
  }

  const parsed = parseContactRequest(input);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", message: parsed.message },
      { status: 400 },
    );
  }

  if (parsed.isBot) {
    return NextResponse.json(
      { message: "Your request has been received." },
      { status: 201 },
    );
  }

  const supabaseStatus = getSupabaseStatus();
  if (!supabaseStatus.configured) {
    return NextResponse.json(
      {
        error: "setup_required",
        message: "Contact storage is not configured.",
      },
      { status: 503 },
    );
  }

  try {
    const requestId = await createContactRequest(parsed.data);
    return NextResponse.json(
      {
        requestId,
        message:
          "Your request has been received. Aayush will review the documentation URL and reply by email.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "[contact] request storage failed",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      {
        error: "contact_unavailable",
        message:
          "The request could not be stored. Email aayushkotadia76@gmail.com directly.",
      },
      { status: 503 },
    );
  }
}
