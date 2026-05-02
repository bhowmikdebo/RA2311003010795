import assert from "node:assert/strict";
import test from "node:test";
import { getTopPriorityNotifications, PriorityInbox } from "../src/priority.js";

const notifications = [
  {
    ID: "event-new",
    Type: "Event",
    Message: "orientation",
    Timestamp: "2026-04-22 17:51:30"
  },
  {
    ID: "placement-old",
    Type: "Placement",
    Message: "campus drive",
    Timestamp: "2026-04-22 17:48:30"
  },
  {
    ID: "result-new",
    Type: "Result",
    Message: "mid-sem",
    Timestamp: "2026-04-22 17:51:18"
  },
  {
    ID: "placement-new",
    Type: "Placement",
    Message: "software role",
    Timestamp: "2026-04-22 17:50:30"
  }
];

test("ranks placements above newer lower-weight notifications", () => {
  const top = getTopPriorityNotifications(notifications, 3);
  assert.deepEqual(
    top.map((notification) => notification.id),
    ["placement-new", "placement-old", "result-new"]
  );
});

test("excludes viewed notifications", () => {
  const top = getTopPriorityNotifications(notifications, 2, ["placement-new"]);
  assert.deepEqual(
    top.map((notification) => notification.id),
    ["placement-old", "result-new"]
  );
});

test("maintains a bounded heap for streaming notifications", () => {
  const inbox = new PriorityInbox(2);
  for (const notification of notifications) {
    inbox.add(notification);
  }

  assert.deepEqual(
    inbox.list().map((notification) => notification.id),
    ["placement-new", "placement-old"]
  );
});

