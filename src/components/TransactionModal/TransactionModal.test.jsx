import { screen, waitFor } from "@testing-library/react";
import TransactionModal from "./TransactionModal";
import {
  ok,
  page,
  pickOption,
  renderWithProviders,
} from "../../test/renderWithProviders";

const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("../../utils/useAxios", () => ({ default: () => mockApi }));

const ACCOUNTS = [
  { id: 1, name: "Cash", balance: 100, currency: { value: "TRY" } },
  { id: 2, name: "Bank", balance: 50, currency: { value: "TRY" } },
  { id: 3, name: "Dollars", balance: 5, currency: { value: "USD" } },
];
const CATEGORIES = [
  { id: 10, name: "Groceries", transactionType: { value: "EXP" } },
  { id: 20, name: "Salary", transactionType: { value: "INC" } },
];
const TRANSACTION = {
  id: 5,
  type: { value: "EXP" },
  amount: 12.5,
  dateTime: "2026-11-01T10:00:00",
  notes: "milk",
  payee: { id: 7, name: "Market", category: { id: 10, name: "Groceries" } },
  sourceAccount: ACCOUNTS[0],
  targetAccount: null,
};

beforeEach(() => {
  mockApi.get
    .mockReset()
    .mockImplementation(() =>
      ok({ accountList: ACCOUNTS, categoryList: CATEGORIES })
    );
  mockApi.post.mockReset().mockImplementation((url, body) => {
    if (url === "transaction/search") {
      return page(body?.id ? [TRANSACTION] : []);
    }
    return page([]); // payee/search
  });
  mockApi.put.mockReset().mockImplementation(() => ok({}));
});

const renderModal = (props = {}) => {
  const close = vi.fn();
  const view = renderWithProviders(
    <TransactionModal close={close} transactionId={null} {...props} />
  );
  return { ...view, close };
};

const field = (name) => screen.getByRole("textbox", { name });

test("edit mode fills the form from the loaded transaction", async () => {
  renderModal({ transactionId: 5 });
  await waitFor(() => expect(field("Payee")).toHaveValue("Market"));
  expect(field("Category")).toHaveValue("Groceries");
  expect(field("Account")).toHaveValue("Cash (100.00 TRY)");
  expect(field("Amount")).toHaveValue("12.50");
  expect(field("Notes")).toHaveValue("milk");
});

// The enums list only ACTIVE categories and accounts; the transaction's own ones come with it
test("edit mode shows the transaction's inactive category and account", async () => {
  const oldAccount = {
    id: 9,
    name: "Old",
    balance: 0,
    currency: { value: "TRY" },
  };
  mockApi.post.mockImplementation((url, body) =>
    url === "transaction/search" && body?.id
      ? page([
          {
            ...TRANSACTION,
            payee: {
              id: 7,
              name: "Market",
              category: {
                id: 99,
                name: "Retired",
                transactionType: { value: "EXP" },
              },
            },
            sourceAccount: oldAccount,
          },
        ])
      : page([])
  );
  renderModal({ transactionId: 5 });

  await waitFor(() => expect(field("Category")).toHaveValue("Retired"));
  expect(field("Account")).toHaveValue("Old (0.00 TRY)");
  expect(mockApi.post).not.toHaveBeenCalledWith(
    "category/search",
    expect.anything(),
    expect.anything()
  );
});

// Payees and categories belong to one transaction type
test("switching the type clears the payee and the category", async () => {
  const { user } = renderModal({ transactionId: 5 });
  await waitFor(() => expect(field("Payee")).toHaveValue("Market"));

  await user.click(screen.getByText("Income"));

  expect(field("Payee")).toHaveValue("");
  expect(field("Category")).toHaveValue("");
});

test("a transfer only offers other accounts with the source's currency", async () => {
  const { user } = renderModal();
  await waitFor(() => expect(field("Account")).toBeEnabled());
  await user.click(screen.getByText("Transfer"));
  await pickOption(user, "Account", "Cash (100.00 TRY)");

  await user.click(field("Target Account"));
  expect(
    await screen.findByRole("option", { name: "Bank (50.00 TRY)" })
  ).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: /Dollars/ })).toBeNull();
  expect(screen.queryByRole("option", { name: /^Cash/ })).toBeNull();
});

// Each pick moves focus to the next field 50 ms later; wait for that move, so it can't land in the
// middle of the next step (this test was flaky under full-suite load)
test("changing the source to another currency clears the chosen target", async () => {
  const { user } = renderModal();
  await waitFor(() => expect(field("Payee")).toHaveFocus());
  await user.click(screen.getByText("Transfer"));
  await waitFor(() => expect(field("Payee")).toHaveFocus());
  await pickOption(user, "Account", "Cash (100.00 TRY)");
  await waitFor(() => expect(field("Target Account")).toHaveFocus());
  await pickOption(user, "Target Account", "Bank (50.00 TRY)");
  await waitFor(() => expect(field("Amount")).toHaveFocus());
  expect(field("Target Account")).toHaveValue("Bank (50.00 TRY)");

  // A searchable Select filters its options by the text in it
  await user.clear(field("Account"));
  await pickOption(user, "Account", "Dollars (5.00 USD)");

  await waitFor(() => expect(field("Target Account")).toHaveValue(""));
});

test("closing with unsaved changes asks for confirmation", async () => {
  const { user, close } = renderModal();
  // The dialog focuses Payee 50 ms after loading; let that happen so it can't take over the typing
  await waitFor(() => expect(field("Payee")).toHaveFocus());
  await new Promise((resolve) => setTimeout(resolve, 100));
  await user.type(field("Notes"), "coffee");
  expect(field("Notes")).toHaveValue("coffee");

  await user.click(screen.getByRole("button", { name: "Cancel" }));

  expect(await screen.findByText("Unsaved Changes")).toBeInTheDocument();
  expect(close).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Yes" }));
  expect(close).toHaveBeenCalledTimes(1);
});

test("closing an untouched form needs no confirmation", async () => {
  const { user, close } = renderModal();
  await waitFor(() => expect(field("Notes")).toBeEnabled());
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(close).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("Unsaved Changes")).toBeNull();
});

// F3/F7: the dialog loads the transaction with fetchById, so a deleted one is "not found"
test("a deleted transaction shows 'not found'", async () => {
  mockApi.post.mockImplementation(() => page([]));
  renderModal({ transactionId: 99 });
  expect(await screen.findByText("Transaction not found")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
});
