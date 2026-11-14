import {
  suggestedAccounts,
  suggestedPayees,
  uniqueByPayee,
} from "./suggestions";

const tx = (id, payeeName, type, accountId) => ({
  id,
  payee: { id: id * 10, name: payeeName },
  type: { value: type },
  sourceAccount: accountId
    ? { id: accountId, name: `Account ${accountId}` }
    : null,
});

const recent = [
  tx(1, "Market", "EXP", 1),
  tx(2, "market ", "EXP", 2), // same payee name, different case and spacing
  tx(3, "Salary", "INC", 1),
  tx(4, "Bakery", "EXP", 3),
];

test("uniqueByPayee keeps the first transaction per payee name", () => {
  expect(uniqueByPayee(recent).map((t) => t.id)).toEqual([1, 3, 4]);
  expect(uniqueByPayee(undefined)).toEqual([]);
});

test("suggestedPayees only offers payees of the selected type", () => {
  expect(suggestedPayees(recent, "EXP").map((p) => p.name)).toEqual([
    "Market",
    "Bakery",
  ]);
  expect(suggestedPayees(recent, "INC").map((p) => p.name)).toEqual(["Salary"]);
  expect(suggestedPayees(recent, "EXP", 1)).toHaveLength(1);
});

test("suggestedAccounts returns distinct source accounts, most recent first", () => {
  expect(suggestedAccounts(recent).map((a) => a.id)).toEqual([1, 2]);
  expect(suggestedAccounts(recent, 3).map((a) => a.id)).toEqual([1, 2, 3]);
  expect(suggestedAccounts([tx(9, "X", "EXP", null)])).toEqual([]);
});
