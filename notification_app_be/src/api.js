import { Log } from "logging_middleware";
import { normalizeNotification } from "./priority.js";

const DEFAULT_API_BASE_URL = "http://20.207.122.201/evaluation-service";

function apiBaseUrl() {
  return (process.env.EVALUATION_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

function accessToken() {
  return process.env.EVALUATION_ACCESS_TOKEN;
}

function parseNotificationsPayload(payload) {
  const notifications = Array.isArray(payload) ? payload : payload?.notifications;
  if (!Array.isArray(notifications)) {
    return [];
  }

  return notifications.map(normalizeNotification).filter(Boolean);
}

function applyLocalQuery(notifications, { limit, page, type }) {
  const filtered = type
    ? notifications.filter((notification) => notification.type === type)
    : notifications;
  const offset = (page - 1) * limit;

  return filtered.slice(offset, offset + limit);
}

async function requestNotifications(url, token) {
  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/json"
    }
  });

  return {
    response,
    payload: await response.json().catch(() => null)
  };
}

export async function fetchNotifications({ limit = 100, page = 1, type } = {}) {
  const token = accessToken();
  if (!token) {
    throw new Error("EVALUATION_ACCESS_TOKEN is required for the protected notification API");
  }

  const url = new URL(`${apiBaseUrl()}/notifications`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("page", String(page));

  if (type) {
    url.searchParams.set("notification_type", type);
  }

  await Log("backend", "info", "service", `fetching notifications page ${page}`, { token });

  let { response, payload } = await requestNotifications(url, token);

  if (response.status === 400 && url.search) {
    await Log("backend", "warn", "service", "query request rejected; retrying notifications without query parameters", {
      token
    });

    const fallback = await requestNotifications(new URL(`${apiBaseUrl()}/notifications`), token);
    response = fallback.response;
    payload = fallback.payload;

    if (response.ok) {
      return applyLocalQuery(parseNotificationsPayload(payload), { limit, page, type });
    }
  }

  if (!response.ok) {
    await Log("backend", "error", "service", `notification API failed with status ${response.status}`, { token });
    throw new Error(`notification API failed with status ${response.status}`);
  }

  const notifications = parseNotificationsPayload(payload);
  await Log("backend", "info", "service", `received ${notifications.length} notifications`, { token });

  return notifications;
}
