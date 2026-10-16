import { NextResponse } from "next/server";
import { getTasksFromBackend } from "@/lib/backendApi";
import { errorResponse } from "@/lib/errorResponse";

export async function GET() {
  try {
    const tasks = await getTasksFromBackend();
    return NextResponse.json({ data: tasks }, { status: 200 });
  } catch (error) {
    return errorResponse(error, "Unable to fetch tasks.");
  }
}
