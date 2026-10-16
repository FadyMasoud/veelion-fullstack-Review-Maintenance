import type { ErrorResponse } from "@/types/api";

// Helpers for calling our own Next.js API routes from client components.

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

// If the error body isn't the JSON we expect (for example an HTML error page),
// show a simple message instead of a JSON parser error.
async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed (${response.status}).`;

  try {
    const body = (await response.json()) as ErrorResponse;
    return body.error?.message || fallback;
  } catch {
    return fallback;
  }
}

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new Error("Could not connect. Check your connection and try again.");
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as T;
}
