// @ts-check
import { toId } from "../../utils/ids";

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
