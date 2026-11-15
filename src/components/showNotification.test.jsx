import { notifications } from "@mantine/notifications";
import showNotification, { resetNotificationLimits } from "./showNotification";

vi.mock("@mantine/notifications", () => ({
  notifications: { show: vi.fn() },
}));

beforeEach(() => {
  vi.useFakeTimers();
  resetNotificationLimits();
  notifications.show.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

const shownMessages = () =>
  notifications.show.mock.calls.map(([config]) => config.message);

// The fixed 5-per-5 s cap used to drop errors too, so a burst could hide the one that matters
test("errors are never dropped by the rate limit", () => {
  for (let i = 0; i < 5; i++) showNotification(`Saved ${i}`, "success");
  showNotification("Couldn't save", "error");
  expect(shownMessages()).toContain("Couldn't save");
});

test("success toasts are capped at 5 per 5 seconds", () => {
  for (let i = 0; i < 7; i++) showNotification(`Saved ${i}`, "success");
  expect(notifications.show).toHaveBeenCalledTimes(5);

  vi.advanceTimersByTime(5000);
  showNotification("Saved again", "success");
  expect(shownMessages()).toContain("Saved again");
});

test("the same message within a second is shown once, later again", () => {
  showNotification("Network error", "error");
  showNotification("Network error", "error");
  expect(notifications.show).toHaveBeenCalledTimes(1);

  vi.advanceTimersByTime(1000);
  showNotification("Network error", "error");
  expect(notifications.show).toHaveBeenCalledTimes(2);
});

// Regression: identical toasts were dropped for 5 s, so a second wrong 2FA code (or a second save)
// a few seconds later looked like nothing happened
test("a user repeating an action a few seconds later sees the result again", () => {
  showNotification("Invalid TOTP code", "error");
  vi.advanceTimersByTime(2000);
  showNotification("Invalid TOTP code", "error");
  expect(notifications.show).toHaveBeenCalledTimes(2);
});
