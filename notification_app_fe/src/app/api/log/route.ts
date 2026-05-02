import { NextResponse } from "next/server";
import { validateLogPayload } from "logging_middleware";

const DEFAULT_API_BASE_URL = "http://20.207.122.201/evaluation-service";

function apiBaseUrl() {
  return (process.env.EVALUATION_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

function parseJson(text: string) {
  if (!text) {
    return { ok: true };
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = validateLogPayload(await request.json());
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "invalid log payload"
      },
      { status: 400 }
    );
  }

  const token = process.env.EVALUATION_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        skipped: true,
        reason: "missing_token"
      },
      { status: 202 }
    );
  }

  const upstream = await fetch(`${apiBaseUrl()}/logs`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  const text = await upstream.text();
  const data = parseJson(text);

  return NextResponse.json(data, { status: upstream.ok ? 200 : upstream.status });
}
