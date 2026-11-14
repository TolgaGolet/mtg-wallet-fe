import { findAccount, targetOptions } from "./accountRules";

const cash = { id: 1, name: "Cash", currency: { value: "TRY" } };
const bank = { id: 2, name: "Bank", currency: { value: "TRY" } };
const dollars = { id: 3, name: "Dollars", currency: { value: "USD" } };
const accounts = [cash, bank, dollars];

test("findAccount matches Select values against numeric ids", () => {
  expect(findAccount(accounts, "2")).toBe(bank);
  expect(findAccount(accounts, null)).toBeUndefined();
  expect(findAccount(accounts, "9")).toBeUndefined();
});

test("a transfer can only go to another account with the same currency", () => {
  expect(targetOptions(accounts, "1")).toEqual([bank]);
  expect(targetOptions(accounts, "3")).toEqual([]);
});
