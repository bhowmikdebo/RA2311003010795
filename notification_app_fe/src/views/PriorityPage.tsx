"use client";

import { useMemo, useState } from "react";
import { Alert, Button, Skeleton, Stack } from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { AppShell } from "@/src/components/AppShell";
import { NotificationCard } from "@/src/components/NotificationCard";
import { NotificationFilters } from "@/src/components/NotificationFilters";
import { useNotifications } from "@/src/hooks/useNotifications";
import { useViewedNotifications } from "@/src/hooks/useViewedNotifications";
import { getPriorityNotifications } from "@/src/lib/notificationPriority";
import type { NotificationType } from "@/src/types/notification";

export function PriorityPage() {
  const [type, setType] = useState<NotificationType | "all">("all");
  const [limit, setLimit] = useState(10);
  const { notifications, isLoading, error, refresh } = useNotifications({ limit: 100, page: 1, type });
  const { viewedIds, markViewed, markManyViewed, resetViewed } = useViewedNotifications();

  const priorityNotifications = useMemo(
    () => getPriorityNotifications(notifications, limit, viewedIds),
    [limit, notifications, viewedIds]
  );

  return (
    <AppShell title="Priority Inbox">
      <NotificationFilters
        type={type}
        onTypeChange={setType}
        limit={limit}
        onLimitChange={setLimit}
        page={1}
        onPageChange={() => undefined}
        onRefresh={refresh}
        showPage={false}
      />

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<DoneAllIcon />}
          onClick={() => markManyViewed(priorityNotifications.map((notification) => notification.id))}
          disabled={priorityNotifications.length === 0}
        >
          Mark Priority Viewed
        </Button>
        <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={resetViewed}>
          Reset Viewed
        </Button>
      </Stack>

      <Stack spacing={2}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={132} sx={{ borderRadius: 1 }} />
            ))
          : priorityNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                viewed={viewedIds.has(notification.id)}
                onMarkViewed={markViewed}
              />
            ))}
        {!isLoading && priorityNotifications.length === 0 ? (
          <Alert severity="info">No unread priority notifications.</Alert>
        ) : null}
      </Stack>
    </AppShell>
  );
}
