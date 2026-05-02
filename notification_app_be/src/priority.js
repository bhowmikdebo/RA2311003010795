export const NOTIFICATION_WEIGHTS = Object.freeze({
  Placement: 3,
  Result: 2,
  Event: 1
});

function toTimestamp(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeNotification(input) {
  const id = input?.ID ?? input?.id;
  const type = input?.Type ?? input?.type;
  const message = input?.Message ?? input?.message;
  const timestamp = input?.Timestamp ?? input?.timestamp;

  if (!id || !type || !message || !timestamp) {
    return null;
  }

  return {
    id: String(id),
    type: String(type),
    message: String(message),
    timestamp: String(timestamp)
  };
}

export function compareNotificationPriority(a, b) {
  const weightDelta = (NOTIFICATION_WEIGHTS[a.type] || 0) - (NOTIFICATION_WEIGHTS[b.type] || 0);
  if (weightDelta !== 0) {
    return weightDelta;
  }

  const timeDelta = toTimestamp(a.timestamp) - toTimestamp(b.timestamp);
  if (timeDelta !== 0) {
    return timeDelta;
  }

  return a.id.localeCompare(b.id);
}

class MinHeap {
  #items = [];
  #compare;

  constructor(compare) {
    this.#compare = compare;
  }

  get size() {
    return this.#items.length;
  }

  peek() {
    return this.#items[0];
  }

  values() {
    return [...this.#items];
  }

  push(item) {
    this.#items.push(item);
    this.#bubbleUp(this.#items.length - 1);
  }

  replaceRoot(item) {
    this.#items[0] = item;
    this.#sinkDown(0);
  }

  #bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.#compare(this.#items[index], this.#items[parent]) >= 0) {
        break;
      }

      [this.#items[index], this.#items[parent]] = [this.#items[parent], this.#items[index]];
      index = parent;
    }
  }

  #sinkDown(index) {
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      let smallest = index;

      if (left < this.#items.length && this.#compare(this.#items[left], this.#items[smallest]) < 0) {
        smallest = left;
      }

      if (right < this.#items.length && this.#compare(this.#items[right], this.#items[smallest]) < 0) {
        smallest = right;
      }

      if (smallest === index) {
        break;
      }

      [this.#items[index], this.#items[smallest]] = [this.#items[smallest], this.#items[index]];
      index = smallest;
    }
  }
}

export class PriorityInbox {
  #limit;
  #viewedIds;
  #heap;

  constructor(limit = 10, viewedIds = []) {
    this.#limit = Math.max(1, Number(limit) || 10);
    this.#viewedIds = new Set(viewedIds);
    this.#heap = new MinHeap(compareNotificationPriority);
  }

  add(input) {
    const notification = normalizeNotification(input);
    if (!notification || this.#viewedIds.has(notification.id)) {
      return;
    }

    if (this.#heap.size < this.#limit) {
      this.#heap.push(notification);
      return;
    }

    if (compareNotificationPriority(notification, this.#heap.peek()) > 0) {
      this.#heap.replaceRoot(notification);
    }
  }

  ingest(notifications) {
    for (const notification of notifications) {
      this.add(notification);
    }

    return this.list();
  }

  markViewed(id) {
    this.#viewedIds.add(id);
  }

  list() {
    return this.#heap.values().sort((a, b) => compareNotificationPriority(b, a));
  }
}

export function getTopPriorityNotifications(notifications, limit = 10, viewedIds = []) {
  return new PriorityInbox(limit, viewedIds).ingest(notifications);
}

