// @ts-check
// Shared by TransactionModal's create and edit, so both send the same request shape.
import { TYPE } from "../../enum/TransactionType";
import { idString, toId } from "../../utils/ids";

/** Suffix and id of the "<name> (New)" option the payee select adds for unknown names. */
export const NEW_PAYEE_POSTFIX = " (New)";
export const NEW_PAYEE_OPTION_ID = "newPayee";
/** Tells the backend to create a payee from `payeeName` (TransactionWriteRequest.NEW_PAYEE_ID). */
export const NEW_PAYEE_REQUEST_ID = -1;

/**
 * The backend's TransactionWriteRequest, built only from the fields it accepts.
 * @param {{ payeeId?: string | null, categoryId?: string | null, amount?: number | string | null,
 *   dateTime?: Date | null, sourceAccountId?: string | null, targetAccountId?: string | null,
 *   notes?: string | null }} values the form values
 * @param {string} typeValue
 * @param {{ id: number | string, name: string }[]} payeeList the payee Select's options
 */
export function buildTransactionRequest(values, typeValue, payeeList) {
  const isTransfer = typeValue === TYPE.TRANSFER;
  return {
    typeValue,
    payeeId:
      values.payeeId === NEW_PAYEE_OPTION_ID
        ? NEW_PAYEE_REQUEST_ID
        : toId(values.payeeId),
    payeeName: payeeList
      .find((p) => idString(p.id) === values.payeeId)
      ?.name?.replace(NEW_PAYEE_POSTFIX, ""),
    categoryId: toId(values.categoryId),
    amount: values.amount,
    dateTime: values.dateTime,
    sourceAccountId: toId(values.sourceAccountId),
    // EXPENSE and INCOME must not have a target account
    targetAccountId: isTransfer ? toId(values.targetAccountId) : null,
    // A cleared Notes field is "", which the backend's @Size(min = 1) rejects; no note is null
    notes: values.notes || null,
  };
}
