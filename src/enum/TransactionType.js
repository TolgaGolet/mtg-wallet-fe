// @ts-check
/** The backend's TransactionType `value`s (what requests send as `typeValue`). */
export const TYPE = Object.freeze({
  EXPENSE: "EXP",
  INCOME: "INC",
  TRANSFER: "TRA",
});

/** Display name of each type. */
export const TYPE_LABEL = Object.freeze({
  [TYPE.EXPENSE]: "Expense",
  [TYPE.INCOME]: "Income",
  [TYPE.TRANSFER]: "Transfer",
});

/** Select options for the three types, in display order. */
export const TYPE_OPTIONS = Object.values(TYPE).map((value) => ({
  value,
  label: TYPE_LABEL[value],
}));
