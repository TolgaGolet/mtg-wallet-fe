import dayjs from "dayjs";

/**
 * The backend stores LocalDateTime (no zone), so send the user's wall-clock time as-is.
 * Uses the date's own offset, so dates in the other daylight-saving season are correct too.
 */
export function toLocalDateTime(date) {
  return dayjs(date).format("YYYY-MM-DDTHH:mm:ss");
}

/**
 * Home's recent-transaction buckets, by calendar days before today. Calendar-day diff (not ms / 24h),
 * so a daylight-saving change doesn't move "yesterday" into "Today". Future dates count as today.
 */
export function getDateGroup(dateTime, now = new Date()) {
  if (!dateTime) {
    return "Older";
  }
  const diffDays = Math.max(
    0,
    dayjs(now).startOf("day").diff(dayjs(dateTime).startOf("day"), "day")
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "Last Week";
  if (diffDays <= 30) return "Last Month";
  return "Older";
}
