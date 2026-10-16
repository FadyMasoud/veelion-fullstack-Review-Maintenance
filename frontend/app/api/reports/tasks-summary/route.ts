import { NextResponse } from "next/server";
import { getTasksSummaryFromBackend } from "@/lib/backendApi";
import { errorResponse } from "@/lib/errorResponse";

export async function GET(request: Request) {
  const days = new URL(request.url).searchParams.get("days");

  try {
    const summary = await getTasksSummaryFromBackend(days);
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    return errorResponse(error, "Unable to fetch the tasks summary.");
  }
}
