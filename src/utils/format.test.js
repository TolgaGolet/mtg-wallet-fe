import { accountOptionLabel, categoryLabel, formatAmount } from "./format";

test("formatAmount uses two decimals and , as the thousands separator", () => {
  expect(formatAmount(1234.5)).toBe("1,234.50");
  expect(formatAmount(-0.1)).toBe("-0.10");
  expect(formatAmount("42")).toBe("42.00");
  expect(formatAmount(null)).toBe("0.00");
  expect(formatAmount(undefined)).toBe("");
});

test("accountOptionLabel shows a formatted balance and the currency", () => {
  expect(
    accountOptionLabel({
      name: "Cash",
      balance: 1234.5,
      currency: { value: "TRY" },
    })
  ).toBe("Cash (1,234.50 TRY)");
});

test("categoryLabel adds the parent in brackets", () => {
  expect(categoryLabel({ name: "Gas", parentCategoryName: "Auto" })).toBe(
    "Gas (Auto)"
  );
  expect(categoryLabel({ name: "Rent", parentCategoryName: null })).toBe(
    "Rent"
  );
  expect(categoryLabel(undefined)).toBe("");
});
