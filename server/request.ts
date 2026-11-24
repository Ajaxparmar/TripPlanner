export class RequestError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

export type RequestBody = Record<string, unknown>;

export async function readBody(request: Request): Promise<RequestBody> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    throw new RequestError("Send a JSON request.", 415);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError("Enter valid details.");
  const decoder = new TextDecoder();
  let size = 0;
  let raw = "";
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > 425_000) {
      await reader.cancel();
      throw new RequestError("The profile photo is too large.", 413);
    }
    raw += decoder.decode(part.value, { stream: true });
  }
  try {
    const body = JSON.parse(raw + decoder.decode());
    if (body && typeof body === "object" && !Array.isArray(body)) return body;
  } catch {}
  throw new RequestError("Enter valid details.");
}

export function stringField(body: RequestBody, key: string, limit: number, required = false) {
  const raw = body[key];
  const value = typeof raw === "string" ? raw.trim() : "";
  if (value.length > limit || (required && !value)) throw new RequestError(`Enter a valid ${key}.`);
  return value;
}

export function dateField(body: RequestBody, key: string, required = false) {
  const value = stringField(body, key, 10, required);
  if (!value) return "";
  const parsed = new Date(value + "T00:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(+parsed) || parsed.toISOString().slice(0, 10) !== value) {
    throw new RequestError("Enter a valid date.");
  }
  return value;
}

export function json(data: object, status = 200, cookie?: string) {
  const headers = new Headers({ "Cache-Control": "no-store" });
  if (cookie) headers.set("Set-Cookie", cookie);
  return Response.json(data, { status, headers });
}

export function isUniqueConflict(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
