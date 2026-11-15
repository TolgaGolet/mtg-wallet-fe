import { buildTransactionFilter } from "./transactionFilter";

// Regression (F13): separate "Source" and "Target" selects looked AND-ed, but the backend OR-s them
test("the account filter matches transactions from or to that account", () => {
  const request = buildTransactionFilter({ accountId: "4" });
  expect(request.sourceAccountId).toBe(4);
  expect(request.targetAccountId).toBe(4);
});

test("empty fields are sent as null, not as empty strings", () => {
  expect(
    buildTransactionFilter({
      transactionType: null,
      payeeName: "",
      amount: "",
      date: null,
      accountId: null,
      notes: "",
    })
  ).toEqual({
    typeValue: null,
    payeeName: null,
    amount: null,
    dateTime: null,
    sourceAccountId: null,
    targetAccountId: null,
    notes: null,
  });
});

test("only fields TransactionSearchRequest accepts are sent", () => {
  const date = new Date(2026, 10, 14);
  expect(
    Object.keys(
      buildTransactionFilter({
        transactionType: "EXP",
        payeeName: "Market",
        amount: 10,
        date,
        accountId: "1",
        notes: "milk",
      })
    ).sort()
  ).toEqual([
    "amount",
    "dateTime",
    "notes",
    "payeeName",
    "sourceAccountId",
    "targetAccountId",
    "typeValue",
  ]);
});
