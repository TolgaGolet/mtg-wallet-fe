// @ts-check
import { toId } from "../../utils/ids";

/** The filter form's values, kept in the URL (`?filter=`), so they survive a refresh or Back. */
export const FILTER_PARAM = "filter";

export const EMPTY_FILTER_VALUES = {
  transactionType: null,
  payeeName: null,
  amount: null,
  date: null,
  accountId: null,
  notes: "",
};

/**
 * The form values for `?filter=`: only the fields that are set, or null when none is (no filter).
 * @param {Record<string, any>} values
 */
export function serializeFilterValues(values) {
  const set = Object.fromEntries(
    Object.keys(EMPTY_FILTER_VALUES)
      .map((key) => [key, values[key]])
      .filter(([, value]) => value != null && value !== "")
  );
  return Object.keys(set).length ? JSON.stringify(set) : null;
}

/**
 * `?filter=` back to form values, or null when it's missing or unreadable (e.g. an edited link).
 * @param {string | null} param
 * @returns {Record<string, any> | null}
 */
export function parseFilterValues(param) {
  if (!param) return null;
  let parsed;
  try {
    parsed = JSON.parse(param);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }
  /** @type {Record<string, any>} */
  const values = { ...EMPTY_FILTER_VALUES };
  for (const key of Object.keys(EMPTY_FILTER_VALUES)) {
    if (parsed[key] != null) values[key] = parsed[key];
  }
  if (values.date != null) {
    const date = new Date(values.date);
    values.date = Number.isNaN(date.getTime()) ? null : date;
  }
  return values;
}

/**
 * The filter form's values as a TransactionSearchRequest (only the fields it accepts).
 * The backend OR-s `sourceAccountId` and `targetAccountId`, so the single "Account" filter sends
 * its id as both: every transaction from or to that account (as Account Detail does).
 *
 * @param {{ transactionType?: string | null, payeeName?: string | null, amount?: number | string | null,
 *   date?: Date | null, accountId?: string | null, notes?: string | null }} values
 */
export function buildTransactionFilter(values) {
  const accountId = toId(values.accountId);
  return {
    typeValue: values.transactionType || null,
    payeeName: values.payeeName || null,
    amount: values.amount === "" ? null : (values.amount ?? null),
    dateTime: values.date || null,
    sourceAccountId: accountId,
    targetAccountId: accountId,
    notes: values.notes || null,
  };
}
