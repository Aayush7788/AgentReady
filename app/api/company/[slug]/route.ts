import { NextResponse } from "next/server";
import { toApiError } from "@/lib/api-errors";
import { getPublicCompanyScore } from "@/lib/public-scores";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const score = await getPublicCompanyScore(slug);
    if (!score) {
      return NextResponse.json({ error: "not_found", message: "Company score not found." }, { status: 404 });
    }

    return NextResponse.json(score);
  } catch (error) {
    const apiError = toApiError(error, {
      error: "company_unavailable",
      message: "Could not load company score.",
    });
    return NextResponse.json(apiError.body, { status: apiError.status });
  }
}
