import { NextResponse } from "next/server";
import { ApiError } from "@/lib/backendApi";

// Turns an error from backendApi into the shared error shape, keeping the
// backend's status code. Anything unexpected becomes a 500 with a safe message.
export function errorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: { message: error.message } }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json({ error: { message: fallbackMessage } }, { status: 500 });
}
