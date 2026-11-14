import {
  buildTransactionRequest,
  NEW_PAYEE_OPTION_ID,
  NEW_PAYEE_REQUEST_ID,
} from "./transactionRequest";

const payeeList = [
  { id: 7, name: "Market" },
  { id: NEW_PAYEE_OPTION_ID, name: "Bakery (New)" },
];

const baseValues = {
  categoryId: "3",
  amount: 12.5,
  dateTime: new Date(2026, 0, 1),
  sourceAccountId: "1",
  targetAccountId: "2",
  notes: null,
};

test("an existing payee is sent by id and the ids become numbers", () => {
  const request = buildTransactionRequest(
    { ...baseValues, payeeId: "7" },
    "EXP",
    payeeList
  );

  expect(request).toMatchObject({
    typeValue: "EXP",
    payeeId: 7,
    payeeName: "Market",
    categoryId: 3,
    sourceAccountId: 1,
    amount: 12.5,
  });
});

test('a new payee is sent as payeeId -1 with its name, without the "(New)" suffix', () => {
  const request = buildTransactionRequest(
    { ...baseValues, payeeId: NEW_PAYEE_OPTION_ID },
    "EXP",
    payeeList
  );

  expect(request.payeeId).toBe(NEW_PAYEE_REQUEST_ID);
  expect(request.payeeName).toBe("Bakery");
});

test("only transfers send a target account", () => {
  const values = { ...baseValues, payeeId: "7" };

  expect(
    buildTransactionRequest(values, "EXP", payeeList).targetAccountId
  ).toBeNull();
  expect(
    buildTransactionRequest(values, "INC", payeeList).targetAccountId
  ).toBeNull();
  expect(
    buildTransactionRequest(values, "TRA", payeeList).targetAccountId
  ).toBe(2);
});

test("empty selects are sent as null, not NaN", () => {
  const request = buildTransactionRequest(
    { ...baseValues, payeeId: null, categoryId: null, sourceAccountId: null },
    "TRA",
    payeeList
  );

  expect(request.payeeId).toBeNull();
  expect(request.categoryId).toBeNull();
  expect(request.sourceAccountId).toBeNull();
});

// Regression: a cleared Notes field went out as "" and the backend's @Size(min = 1) answered 400
test("a cleared note is sent as null, a real note as typed", () => {
  expect(
    buildTransactionRequest({ ...baseValues, notes: "" }, "EXP", payeeList)
      .notes
  ).toBeNull();
  expect(
    buildTransactionRequest({ ...baseValues, notes: "Lunch" }, "EXP", payeeList)
      .notes
  ).toBe("Lunch");
});
