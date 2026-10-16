import { NextResponse } from "next/server";
import { updateTaskInBackend } from "@/lib/backendApi";
import { errorResponse } from "@/lib/errorResponse";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, { params }: RouteParams) {
  let payload: { completed?: unknown } | null;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: { message: "Request body must be valid JSON." } }, { status: 400 });
  }

  if (typeof payload?.completed !== "boolean") {
    return NextResponse.json({ error: { message: "completed must be boolean" } }, { status: 400 });
  }

  try {
    const task = await updateTaskInBackend(params.id, payload.completed);
    return NextResponse.json({ data: task }, { status: 200 });
  } catch (error) {
    return errorResponse(error, "Unable to update task.");
  }
}
