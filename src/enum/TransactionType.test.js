import { TYPE, TYPE_LABEL, TYPE_OPTIONS } from "./TransactionType";

test("the type values match the backend's TransactionType values", () => {
  expect(TYPE).toEqual({ EXPENSE: "EXP", INCOME: "INC", TRANSFER: "TRA" });
});

test("the options list every type in display order with its label", () => {
  expect(TYPE_OPTIONS).toEqual([
    { value: "EXP", label: "Expense" },
    { value: "INC", label: "Income" },
    { value: "TRA", label: "Transfer" },
  ]);
});

test("the constants can't be changed at runtime", () => {
  expect(Object.isFrozen(TYPE)).toBe(true);
  expect(Object.isFrozen(TYPE_LABEL)).toBe(true);
});
