# Stage 1

## Goal

The priority inbox returns the top `n` unread campus notifications, with `n = 10` as the default. Notifications are fetched from the provided notification API and are not stored in a database or hard-coded in the repository.

## Priority Rules

Priority is determined by two ordered signals:

1. Notification type weight: `Placement` > `Result` > `Event`.
2. Recency: newer timestamps rank above older timestamps within the same type.

If two notifications have the same type and timestamp, the notification `ID` is used as a deterministic tie-breaker so repeated runs produce stable output.

## Efficient Top 10 Maintenance

The implementation uses a bounded min-heap with capacity `n`.

- Each unread notification is compared with the lowest-ranked item currently in the heap.
- If the heap has fewer than `n` items, the notification is inserted.
- If the heap is full and the incoming notification has higher priority than the heap root, the root is replaced.
- The final heap is sorted from highest to lowest priority only when results are requested.

This keeps update cost at `O(log n)` per incoming notification and memory at `O(n)`. With `n = 10`, new notifications can be processed continuously without re-sorting the whole collection.

## Unread Handling

Stage 1 treats all fetched notifications as unread unless a caller supplies viewed IDs. Stage 2 stores viewed notification IDs in the browser and reuses the same priority rules to show only unread priority notifications.

## API Flow

1. Read `EVALUATION_ACCESS_TOKEN` from the environment.
2. Fetch notifications from `GET /notifications`.
3. Normalize notification fields into `{ id, type, message, timestamp }`.
4. Run the bounded heap priority selection.
5. Return a JSON payload containing the selected top notifications.

All meaningful execution points call the reusable logging middleware using valid stack, level, and package values.

## Run

```bash
npm install
npm run stage1 -- --limit 10
```

Optional filters:

```bash
npm run stage1 -- --limit 10 --page 1 --type Placement
```

## Complexity

- Building the top `n`: `O(m log n)` for `m` notifications.
- Maintaining the top `n` as new notifications arrive: `O(log n)` per notification.
- Returning ordered results: `O(n log n)`.

