import { screen } from "@testing-library/react";
import TransactionRow from "./TransactionRow";
import { renderWithProviders } from "../test/renderWithProviders";

const base = {
  id: 1,
  amount: 1234.5,
  dateTime: "2026-11-01T12:00:00",
  payee: {
    name: "Market",
    category: { name: "Food", parentCategoryName: null },
  },
  sourceAccount: { name: "Cash", currency: { value: "TRY" } },
  targetAccount: null,
};

const renderRow = (overrides = {}, props = {}) =>
  renderWithProviders(
    <TransactionRow
      transaction={{ ...base, ...overrides }}
      onClick={vi.fn()}
      {...props}
    />
  );

const row = () => screen.getByRole("button");

test("an expense carries a minus sign, also in its accessible name", () => {
  renderRow({ type: { value: "EXP" } });

  expect(screen.getByText("−₺ 1,234.50")).toBeInTheDocument();
  expect(row()).toHaveAccessibleName(
    expect.stringMatching(/^Expense, Market, −₺ 1,234\.50, /)
  );
});

test("an income carries a plus sign", () => {
  renderRow({ type: { value: "INC" } });

  expect(screen.getByText("+₺ 1,234.50")).toBeInTheDocument();
  expect(row()).toHaveAccessibleName(
    expect.stringMatching(/^Income, Market, \+₺ 1,234\.50, /)
  );
});

test("a transfer has no sign and names both accounts", () => {
  renderRow({
    type: { value: "TRA" },
    targetAccount: { name: "Bank" },
  });

  expect(screen.getByText("₺ 1,234.50")).toBeInTheDocument();
  expect(screen.getByText("Cash → Bank")).toBeInTheDocument();
  expect(row()).toHaveAccessibleName(
    expect.stringMatching(/^Transfer, Market, ₺ 1,234\.50, .*, Cash → Bank$/)
  );
});

test("shows the payee and its category with the parent", () => {
  renderRow({
    type: { value: "EXP" },
    payee: {
      name: "Shell",
      category: { name: "Gas", parentCategoryName: "Auto" },
    },
  });

  expect(screen.getByText("Shell")).toBeInTheDocument();
  expect(screen.getByText("Gas (Auto)")).toBeInTheDocument();
});

test("a currency without a known symbol shows its code", () => {
  renderRow({
    type: { value: "EXP" },
    sourceAccount: { name: "Cash", currency: { value: "GBP" } },
  });

  expect(screen.getByText("−GBP 1,234.50")).toBeInTheDocument();
});

test("an unknown type is shown as a transfer, without a sign", () => {
  renderRow({ type: { value: "XYZ" } });

  expect(row()).toHaveAccessibleName(expect.stringMatching(/^Transfer, /));
  expect(screen.getByText("₺ 1,234.50")).toBeInTheDocument();
});

test("opens on click and on Enter", async () => {
  const onClick = vi.fn();
  const { user } = renderRow({ type: { value: "EXP" } }, { onClick });

  await user.click(row());
  row().focus();
  await user.keyboard("{Enter}");

  expect(onClick).toHaveBeenCalledTimes(2);
});
