// Shared by TransactionModal's create and edit, so both send the same request shape.

/** Suffix and id of the "<name> (New)" option the payee select adds for unknown names. */
export const NEW_PAYEE_POSTFIX = " (New)";
export const NEW_PAYEE_OPTION_ID = "newPayee";
/** Tells the backend to create a payee from `payeeName` (TransactionCreateRequest.NEW_PAYEE_ID). */
export const NEW_PAYEE_REQUEST_ID = -1;

const toId = (value) =>
  value === null || value === undefined || value === ""
    ? null
    : parseInt(value);

export function buildTransactionRequest(values, typeValue, payeeList) {
  const isTransfer = typeValue === "TRA";
  return {
    ...values,
    typeValue,
    // A cleared Notes field is "", which the backend's @Size(min = 1) rejects; no note is null
    notes: values.notes || null,
    categoryId: toId(values.categoryId),
    payeeId:
      values.payeeId === NEW_PAYEE_OPTION_ID
        ? NEW_PAYEE_REQUEST_ID
        : toId(values.payeeId),
    payeeName: payeeList
      .find((p) => p.id + "" === values.payeeId)
      ?.name?.replace(NEW_PAYEE_POSTFIX, ""),
    sourceAccountId: toId(values.sourceAccountId),
    // EXPENSE and INCOME must not have a target account
    targetAccountId: isTransfer ? toId(values.targetAccountId) : null,
  };
}
