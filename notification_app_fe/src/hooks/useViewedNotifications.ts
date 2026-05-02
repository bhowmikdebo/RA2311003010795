"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { appLog } from "@/src/lib/logger";

const STORAGE_KEY = "campus-notification-viewed-ids";

function readStoredIds() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeStoredIds(ids: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function useViewedNotifications() {
  const [viewedIds, setViewedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setViewedIds(new Set(readStoredIds()));
  }, []);

  const markViewed = useCallback((id: string) => {
    setViewedIds((current) => {
      if (current.has(id)) {
        return current;
      }

      const next = new Set(current);
      next.add(id);
      writeStoredIds([...next]);
      void appLog("info", "state", `marked notification ${id} as viewed`);
      return next;
    });
  }, []);

  const markManyViewed = useCallback((ids: string[]) => {
    setViewedIds((current) => {
      const next = new Set(current);
      for (const id of ids) {
        next.add(id);
      }

      writeStoredIds([...next]);
      void appLog("info", "state", `marked ${ids.length} notifications as viewed`);
      return next;
    });
  }, []);

  const resetViewed = useCallback(() => {
    setViewedIds(new Set());
    writeStoredIds([]);
    void appLog("warn", "state", "cleared viewed notification state");
  }, []);

  return useMemo(
    () => ({
      viewedIds,
      markViewed,
      markManyViewed,
      resetViewed
    }),
    [markManyViewed, markViewed, resetViewed, viewedIds]
  );
}

