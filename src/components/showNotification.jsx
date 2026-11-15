import { notifications } from "@mantine/notifications";
import { rem } from "@mantine/core";
import { IconX, IconCheck } from "@tabler/icons-react";

const WINDOW_MS = 5000;
const MAX_PER_WINDOW = 5;
// Long enough for a burst of parallel requests failing alike, shorter than a user retrying
const DEDUP_MS = 1000;

let windowStart = 0;
let shownInWindow = 0;
/** When each `type|message` was last shown. */
const lastShownAt = new Map();

const CONFIG_BY_TYPE = {
  success: {
    color: "teal",
    title: "Success",
    icon: <IconCheck style={{ width: rem(18), height: rem(18) }} />,
  },
  error: {
    color: "red",
    title: "Error",
    icon: <IconX style={{ width: rem(18), height: rem(18) }} />,
  },
};

/**
 * The only way to show a toast. A message identical to one shown in the last second is dropped (e.g.
 * several failed requests with the same error); a user repeating an action still sees each result. Other success/info toasts are capped at 5 per 5 s;
 * errors are never capped, so the one that matters can't be lost in a burst.
 *
 * @param {string} message
 * @param {"success" | "error"} [type]
 */
const showNotification = (message, type) => {
  const now = Date.now();
  const key = `${type}|${message}`;
  if (now - (lastShownAt.get(key) ?? -Infinity) < DEDUP_MS) {
    return;
  }

  if (type !== "error") {
    if (now - windowStart >= WINDOW_MS) {
      windowStart = now;
      shownInWindow = 0;
    }
    if (shownInWindow >= MAX_PER_WINDOW) {
      return;
    }
    shownInWindow++;
  }

  // Forget old entries, so the map can't grow without bound
  for (const [shownKey, shownAt] of lastShownAt) {
    if (now - shownAt >= DEDUP_MS) {
      lastShownAt.delete(shownKey);
    }
  }
  lastShownAt.set(key, now);

  notifications.show({
    ...CONFIG_BY_TYPE[type],
    message,
    autoClose: WINDOW_MS,
  });
};

/** Test helper: forgets every toast shown so far. */
export const resetNotificationLimits = () => {
  windowStart = 0;
  shownInWindow = 0;
  lastShownAt.clear();
};

export default showNotification;
