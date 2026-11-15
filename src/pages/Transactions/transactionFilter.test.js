import {
  buildTransactionFilter,
  EMPTY_FILTER_VALUES,
  parseFilterValues,
  serializeFilterValues,
} from "./transactionFilter";

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

test("filter values survive the URL round trip, the date included", () => {
  const date = new Date(2026, 10, 14);
  const values = { ...EMPTY_FILTER_VALUES, amount: 10, date, notes: "rent" };

  const param = serializeFilterValues(values);

  expect(JSON.parse(param)).toEqual({
    amount: 10,
    date: date.toISOString(),
    notes: "rent",
  });
  expect(parseFilterValues(param)).toEqual(values);
});

test("no filter and an unreadable one both read as no filter", () => {
  expect(serializeFilterValues(EMPTY_FILTER_VALUES)).toBeNull();
  expect(parseFilterValues(null)).toBeNull();
  expect(parseFilterValues("not json")).toBeNull();
  expect(parseFilterValues("[1]")).toBeNull();
});
