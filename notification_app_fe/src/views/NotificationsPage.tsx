"use client";

import { useState } from "react";
import { Alert, Button, Skeleton, Stack } from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { AppShell } from "@/src/components/AppShell";
import { NotificationCard } from "@/src/components/NotificationCard";
import { NotificationFilters } from "@/src/components/NotificationFilters";
import { useNotifications } from "@/src/hooks/useNotifications";
import { useViewedNotifications } from "@/src/hooks/useViewedNotifications";
import type { NotificationType } from "@/src/types/notification";

export function NotificationsPage() {
  const [type, setType] = useState<NotificationType | "all">("all");
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const { notifications, isLoading, error, refresh } = useNotifications({ limit, page, type });
  const { viewedIds, markViewed, markManyViewed } = useViewedNotifications();

  return (
    <AppShell title="All Notifications">
      <NotificationFilters
        type={type}
        onTypeChange={(value) => {
          setType(value);
          setPage(1);
        }}
        limit={limit}
        onLimitChange={setLimit}
        page={page}
        onPageChange={setPage}
        onRefresh={refresh}
      />

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<DoneAllIcon />}
          onClick={() => markManyViewed(notifications.map((notification) => notification.id))}
          disabled={notifications.length === 0}
        >
          Mark Page Viewed
        </Button>
      </Stack>

      <Stack spacing={2}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={132} sx={{ borderRadius: 1 }} />
            ))
          : notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                viewed={viewedIds.has(notification.id)}
                onMarkViewed={markViewed}
              />
            ))}
        {!isLoading && notifications.length === 0 ? <Alert severity="info">No notifications found.</Alert> : null}
      </Stack>
    </AppShell>
  );
}
