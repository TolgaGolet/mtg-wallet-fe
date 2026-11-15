// @ts-check
// Mantine Selects work with string values, the backend with numeric ids.

/**
 * A numeric id as a Select value ("7"), or null when there is none.
 * @param {number | string | null | undefined} id
 */
export const idString = (id) =>
  id === null || id === undefined || id === "" ? null : String(id);

/**
 * A Select value ("7") as the numeric id the backend expects, or null when empty.
 * @param {string | number | null | undefined} value
 */
export const toId = (value) =>
  value === null || value === undefined || value === ""
    ? null
    : parseInt(String(value), 10);
