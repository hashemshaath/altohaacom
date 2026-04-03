import { jsonHeaders, sseHeaders, corsHeaders } from "./cors.ts";

/** Return a JSON success response */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

/** Return a JSON error response with appropriate status code */
export function errorResponse(error: unknown, defaultStatus = 500): Response {
  const message = error instanceof Error ? error.message : "Unknown error";

  const statusMap: Record<string, number> = {
    "Unauthorized": 401,
    "Forbidden": 403,
    "Not Found": 404,
    "Rate limited": 429,
    "Rate limit exceeded": 429,
    "Credits exhausted": 402,
  };

  const status = statusMap[message] || defaultStatus;
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: jsonHeaders,
  });
}

/** Return an SSE stream response */
export function streamResponse(body: ReadableStream | null): Response {
  return new Response(body, { headers: sseHeaders });
}

/** Validate required fields in request body, returns error Response or null */
export function validateRequired(
  body: Record<string, unknown>,
  fields: string[]
): Response | null {
  const missing = fields.filter((f) => !body[f]);
  if (missing.length > 0) {
    return new Response(
      JSON.stringify({ error: `Missing required fields: ${missing.join(", ")}` }),
      { status: 400, headers: jsonHeaders }
    );
  }
  return null;
}
