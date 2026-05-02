"use client";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography
} from "@mui/material";
import { formatNotificationTime } from "@/src/lib/notificationPriority";
import type { NotificationItem } from "@/src/types/notification";

const typeColor = {
  Placement: "primary",
  Result: "secondary",
  Event: "warning"
} as const;

export function NotificationCard({
  notification,
  viewed,
  onMarkViewed
}: {
  notification: NotificationItem;
  viewed: boolean;
  onMarkViewed: (id: string) => void;
}) {
  return (
    <Card variant="outlined" sx={{ borderColor: viewed ? "divider" : "primary.main", bgcolor: viewed ? "background.paper" : "#ffffff" }}>
      <CardContent>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
          <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={notification.type} color={typeColor[notification.type]} size="small" />
              <Chip
                label={viewed ? "Viewed" : "New"}
                color={viewed ? "default" : "success"}
                size="small"
                icon={viewed ? <CheckCircleOutlineIcon /> : undefined}
              />
            </Stack>
            <Typography variant="h6" sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>
              {notification.message}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatNotificationTime(notification.timestamp)}
            </Typography>
          </Stack>
          <Button
            variant={viewed ? "outlined" : "contained"}
            startIcon={<VisibilityIcon />}
            onClick={() => onMarkViewed(notification.id)}
            disabled={viewed}
            sx={{ alignSelf: { xs: "stretch", sm: "center" } }}
          >
            Mark Viewed
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

