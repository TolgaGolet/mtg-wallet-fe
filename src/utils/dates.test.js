import { getDateGroup, toLocalDateTime } from "./dates";

describe("toLocalDateTime (FE-14)", () => {
  test("formats the local wall-clock time without a zone", () => {
    expect(toLocalDateTime(new Date(2026, 0, 5, 7, 4, 9))).toBe(
      "2026-01-05T07:04:09"
    );
  });

  // The old code added one offset taken at page load, which was an hour off for dates in the
  // other daylight-saving season. Formatting uses each date's own local time instead.
  test("summer and winter dates keep the time the user picked", () => {
    expect(toLocalDateTime(new Date(2026, 0, 15, 12, 0))).toBe(
      "2026-01-15T12:00:00"
    );
    expect(toLocalDateTime(new Date(2026, 6, 15, 12, 0))).toBe(
      "2026-07-15T12:00:00"
    );
  });

  test("a date-only pick (local midnight) stays on the same day", () => {
    expect(toLocalDateTime(new Date(2026, 10, 14))).toBe("2026-11-14T00:00:00");
  });
});

describe("getDateGroup", () => {
  const now = new Date(2026, 10, 14, 9, 0);

  test("buckets by calendar days before today", () => {
    expect(getDateGroup(new Date(2026, 10, 14, 0, 1), now)).toBe("Today");
    expect(getDateGroup(new Date(2026, 10, 13, 23, 59), now)).toBe("Yesterday");
    expect(getDateGroup(new Date(2026, 10, 7), now)).toBe("Last Week");
    expect(getDateGroup(new Date(2026, 9, 15), now)).toBe("Last Month");
    expect(getDateGroup(new Date(2026, 9, 14), now)).toBe("Older");
  });

  test("future dates and missing dates", () => {
    expect(getDateGroup(new Date(2026, 10, 15), now)).toBe("Today");
    expect(getDateGroup(null, now)).toBe("Older");
  });
});
