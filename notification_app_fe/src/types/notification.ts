export type NotificationType = "Placement" | "Result" | "Event";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: string;
}

export interface NotificationResponse {
  notifications: unknown[];
  error?: string;
}

