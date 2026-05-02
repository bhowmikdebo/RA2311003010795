import { NextResponse } from "next/server";
import { Log } from "logging_middleware";

const DEFAULT_API_BASE_URL = "http://20.207.122.201/evaluation-service";

function apiBaseUrl() {
  return (process.env.EVALUATION_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

function parseJson(text: string) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function upstreamErrorMessage(payload: unknown, status: number) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === "string" && error.trim()) {
      return error;
    }
  }

  return `notification API failed with status ${status}`;
}

function notificationsFromPayload(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object" && Array.isArray((payload as { notifications?: unknown }).notifications)) {
    return (payload as { notifications: unknown[] }).notifications;
  }

  return [];
}

function normalizeType(value: unknown) {
  if (!value || typeof value !== "string") {
    return "";
  }

  return value;
}

function applyLocalQuery(notifications: unknown[], incoming: URL) {
  const limit = Math.max(1, Number(incoming.searchParams.get("limit")) || 20);
  const page = Math.max(1, Number(incoming.searchParams.get("page")) || 1);
  const type = incoming.searchParams.get("notification_type");
  const filtered = type
    ? notifications.filter((notification) => {
      if (!notification || typeof notification !== "object") {
        return false;
      }

      const record = notification as Record<string, unknown>;
      return normalizeType(record.Type ?? record.type) === type;
    })
    : notifications;
  const offset = (page - 1) * limit;

  return filtered.slice(offset, offset + limit);
}

async function requestNotifications(url: URL, token: string) {
  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/json"
    },
    cache: "no-store"
  });

  return {
    response,
    payload: parseJson(await response.text())
  };
}

export async function GET(request: Request) {
  const token = process.env.EVALUATION_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      {
        notifications: [],
        error: "EVALUATION_ACCESS_TOKEN is required for the protected notification API"
      },
      { status: 401 }
    );
  }

  const incoming = new URL(request.url);
  const upstreamUrl = new URL(`${apiBaseUrl()}/notifications`);

  for (const key of ["limit", "page", "notification_type"]) {
    const value = incoming.searchParams.get(key);
    if (value) {
      upstreamUrl.searchParams.set(key, value);
    }
  }

  await Log("frontend", "info", "api", `fetching notifications with ${upstreamUrl.searchParams.toString()}`, {
    token
  });

  try {
    let { response, payload } = await requestNotifications(upstreamUrl, token);

    if (response.status === 400 && upstreamUrl.search) {
      await Log("frontend", "warn", "api", "query request rejected; retrying notifications without query parameters", {
        token
      });

      const fallbackUrl = new URL(`${apiBaseUrl()}/notifications`);
      const fallback = await requestNotifications(fallbackUrl, token);
      response = fallback.response;
      payload = fallback.payload;

      if (response.ok) {
        return NextResponse.json({
          notifications: applyLocalQuery(notificationsFromPayload(payload), incoming)
        });
      }
    }

    if (!response.ok) {
      const errorMessage = upstreamErrorMessage(payload, response.status);
      await Log("frontend", "error", "api", `notifications request failed with status ${response.status}`, {
        token
      });

      return NextResponse.json(
        {
          notifications: [],
          error: errorMessage,
          upstream: payload
        },
        { status: response.status }
      );
    }

    const notifications = Array.isArray(payload) ? payload : payload?.notifications ?? [];
    await Log("frontend", "info", "api", `received ${notifications.length} notifications`, { token });

    return NextResponse.json({
      ...(payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {}),
      notifications
    });
  } catch (error) {
    await Log(
      "frontend",
      "error",
      "api",
      `notifications request failed: ${error instanceof Error ? error.message : "unknown error"}`,
      { token }
    );

    return NextResponse.json(
      {
        notifications: [],
        error: "notification API request failed"
      },
      { status: 502 }
    );
  }
}
