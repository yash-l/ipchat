import { NextResponse } from "next/server";

export const ApiResponse = {
  success<T extends Record<string, unknown>>(data: T, status = 200) {
    return NextResponse.json({ ok: true, ...data }, { status });
  },
  error(message: string, status = 400, details?: Record<string, unknown>) {
    return NextResponse.json({ ok: false, error: message, details }, { status });
  },
  unauthorized(message = "Unauthorized") {
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  },
  forbidden(message = "Forbidden") {
    return NextResponse.json({ ok: false, error: message }, { status: 403 });
  },
  notFound(message = "Not found") {
    return NextResponse.json({ ok: false, error: message }, { status: 404 });
  },
  rateLimited(message = "Too many requests. Please slow down.") {
    return NextResponse.json({ ok: false, error: message }, { status: 429 });
  }
};
