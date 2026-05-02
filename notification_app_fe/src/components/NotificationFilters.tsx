"use client";

import FilterListIcon from "@mui/icons-material/FilterList";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField
} from "@mui/material";
import { NOTIFICATION_TYPES } from "@/src/lib/notificationPriority";
import type { NotificationType } from "@/src/types/notification";

export function NotificationFilters({
  type,
  onTypeChange,
  limit,
  onLimitChange,
  page,
  onPageChange,
  onRefresh,
  showPage = true
}: {
  type: NotificationType | "all";
  onTypeChange: (type: NotificationType | "all") => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  page: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  showPage?: boolean;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 1 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="notification-type-label">Type</InputLabel>
          <Select
            labelId="notification-type-label"
            value={type}
            label="Type"
            startAdornment={<FilterListIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />}
            onChange={(event) => onTypeChange(event.target.value as NotificationType | "all")}
          >
            <MenuItem value="all">All</MenuItem>
            {NOTIFICATION_TYPES.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          type="number"
          label="Limit"
          value={limit}
          inputProps={{ min: 1, max: 50 }}
          onChange={(event) => onLimitChange(Math.max(1, Number(event.target.value) || 1))}
          sx={{ width: { xs: "100%", md: 120 } }}
        />
        {showPage ? (
          <TextField
            size="small"
            type="number"
            label="Page"
            value={page}
            inputProps={{ min: 1 }}
            onChange={(event) => onPageChange(Math.max(1, Number(event.target.value) || 1))}
            sx={{ width: { xs: "100%", md: 120 } }}
          />
        ) : null}
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={onRefresh} sx={{ ml: { md: "auto" } }}>
          Refresh
        </Button>
      </Stack>
    </Paper>
  );
}

