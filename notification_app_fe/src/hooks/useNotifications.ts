"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { appLog } from "@/src/lib/logger";
import { normalizeNotification } from "@/src/lib/notificationPriority";
import type { NotificationItem, NotificationResponse, NotificationType } from "@/src/types/notification";

interface UseNotificationsOptions {
  limit: number;
  page: number;
  type: NotificationType | "all";
}

export function useNotifications({ limit, page, type }: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("page", String(page));
    if (type !== "all") {
      params.set("notification_type", type);
    }

    return params.toString();
  }, [limit, page, type]);

  const refresh = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadNotifications() {
      setIsLoading(true);
      setError(null);
      void appLog("info", "api", `loading notifications: ${query}`);

      try {
        const response = await fetch(`/api/notifications?${query}`, {
          cache: "no-store",
          signal: controller.signal
        });
        const payload = (await response.json()) as NotificationResponse;

        if (!response.ok) {
          throw new Error(payload.error || `request failed with status ${response.status}`);
        }

        const normalized = payload.notifications
          .map(normalizeNotification)
          .filter((notification): notification is NotificationItem => Boolean(notification));
        setNotifications(normalized);
        void appLog("info", "state", `stored ${normalized.length} notifications`);
      } catch (caught) {
        if (!controller.signal.aborted) {
          const message = caught instanceof Error ? caught.message : "unable to load notifications";
          setError(message);
          void appLog("error", "api", `notification load failed: ${message}`);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadNotifications();

    return () => {
      controller.abort();
    };
  }, [query, refreshKey]);

  return {
    notifications,
    isLoading,
    error,
    refresh
  };
}
