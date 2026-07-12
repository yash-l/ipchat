import { NextRequest } from "next/server";
import { z } from "zod";
import { ApiResponse } from "./api-response";

type ParseResult<T> = { ok: true; data: T } | { ok: false; response: Response };

/** Parses+validates a JSON request body against a Zod schema. */
export async function parseBody<S extends z.ZodTypeAny>(
  req: NextRequest,
  schema: S
): Promise<ParseResult<z.infer<S>>> {
  const raw = await req.json().catch(() => null);
  const result = schema.safeParse(raw);
  if (!result.success) {
    const details = result.error.flatten().fieldErrors;
    return { ok: false, response: ApiResponse.error("Invalid request body", 400, details) };
  }
  return { ok: true, data: result.data };
}

/** Parses query-string params against a Zod schema (e.g. pagination). */
export function parseQuery<S extends z.ZodTypeAny>(req: NextRequest, schema: S): z.infer<S> {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  return schema.parse(params);
}
