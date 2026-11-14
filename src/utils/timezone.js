// Kept out of index.js so other modules don't import the app entry point.
export const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
