import { NextResponse } from "next/server";
import { getActivityFromBackend } from "@/lib/backendApi";
import { errorResponse } from "@/lib/errorResponse";

export async function GET() {
  try {
    const logs = await getActivityFromBackend();
    return NextResponse.json(logs, { status: 200 });
  } catch (error) {
    return errorResponse(error, "Unable to fetch activity logs.");
  }
}
