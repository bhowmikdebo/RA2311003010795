import type { NotificationItem, NotificationType } from "@/src/types/notification";

export const NOTIFICATION_TYPES: NotificationType[] = ["Placement", "Result", "Event"];

export const NOTIFICATION_WEIGHTS: Record<NotificationType, number> = {
  Placement: 3,
  Result: 2,
  Event: 1
};

function toTimestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeNotification(input: unknown): NotificationItem | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const record = input as Record<string, unknown>;
  const id = record.ID ?? record.id;
  const type = record.Type ?? record.type;
  const message = record.Message ?? record.message;
  const timestamp = record.Timestamp ?? record.timestamp;

  if (
    typeof id !== "string" ||
    typeof type !== "string" ||
    typeof message !== "string" ||
    typeof timestamp !== "string" ||
    !NOTIFICATION_TYPES.includes(type as NotificationType)
  ) {
    return null;
  }

  return {
    id,
    type: type as NotificationType,
    message,
    timestamp
  };
}

export function compareNotificationPriority(a: NotificationItem, b: NotificationItem) {
  const weightDelta = NOTIFICATION_WEIGHTS[a.type] - NOTIFICATION_WEIGHTS[b.type];
  if (weightDelta !== 0) {
    return weightDelta;
  }

  const timeDelta = toTimestamp(a.timestamp) - toTimestamp(b.timestamp);
  if (timeDelta !== 0) {
    return timeDelta;
  }

  return a.id.localeCompare(b.id);
}

export function getPriorityNotifications(
  notifications: NotificationItem[],
  limit: number,
  viewedIds: Set<string>
) {
  return notifications
    .filter((notification) => !viewedIds.has(notification.id))
    .sort((a, b) => compareNotificationPriority(b, a))
    .slice(0, limit);
}

export function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

