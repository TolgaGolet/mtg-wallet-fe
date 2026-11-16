import { screen, waitFor } from "@testing-library/react";
import AccountDetail from "./AccountDetail";
import { page, renderWithProviders } from "../../test/renderWithProviders";

const mockApi = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("../../utils/useAxios", () => ({ default: () => mockApi }));

const ACCOUNT = {
  id: 3,
  name: "Wallet",
  type: { label: "Cash" },
  balance: 1234.5,
  currency: { value: "TRY", label: "Turkish Lira" },
};
const LUNCH = {
  id: 50,
  type: { value: "EXP" },
  amount: 42,
  dateTime: "2026-11-01T12:00:00",
  payee: { name: "Lunch Place", category: { name: "Food" } },
  sourceAccount: { name: "Wallet", currency: { value: "TRY" } },
};

/** Answers account and transaction searches separately. */
const mockSearches = ({ account, transactions }) =>
  mockApi.post
    .mockReset()
    .mockImplementation((url) =>
      url === "account/search" ? account() : transactions()
    );

beforeEach(() => {
  mockSearches({
    account: () => page([ACCOUNT]),
    transactions: () => page([LUNCH]),
  });
});

const renderPage = () =>
  renderWithProviders(<AccountDetail />, {
    route: "/accounts/3",
    path: "/accounts/:accountId",
  });

test("shows the account and the transactions touching it as source or target", async () => {
  renderPage();

  expect(await screen.findByText("Wallet", { selector: "p" })).toBeVisible();
  expect(screen.getByText("1,234.50")).toBeInTheDocument();
  expect(screen.getByText("TRY - Turkish Lira")).toBeInTheDocument();
  expect(await screen.findByText("Lunch Place")).toBeInTheDocument();
  // The backend OR-s the two ids, so passing the same one lists every side of the account
  expect(mockApi.post).toHaveBeenCalledWith(
    "transaction/search",
    { sourceAccountId: "3", targetAccountId: "3" },
    expect.objectContaining({ params: { pageNo: 0 } })
  );
});

test("the edit button links to this account's form", async () => {
  renderPage();

  expect(
    await screen.findByRole("link", { name: "Edit account" })
  ).toHaveAttribute("href", "/accounts/create-or-edit/3");
});

test("a missing account shows 'not found' instead of an empty card", async () => {
  mockSearches({ account: () => page([]), transactions: () => page([]) });
  renderPage();

  expect(await screen.findByText(/not found/i)).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Edit account" })).toBeNull();
});

test("a failed account load still shows the transactions", async () => {
  mockSearches({
    account: () => Promise.reject({ response: { status: 500 } }),
    transactions: () => page([LUNCH]),
  });
  renderPage();

  expect(
    await screen.findByText("Couldn't load the account")
  ).toBeInTheDocument();
  expect(await screen.findByText("Lunch Place")).toBeInTheDocument();
});

test("an account without transactions says so", async () => {
  mockSearches({
    account: () => page([ACCOUNT]),
    transactions: () => page([]),
  });
  renderPage();

  expect(
    await screen.findByText("No transactions for this account yet")
  ).toBeInTheDocument();
});

test("a failed transaction load offers a retry that reloads the list", async () => {
  mockSearches({
    account: () => page([ACCOUNT]),
    transactions: vi
      .fn()
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockImplementation(() => page([LUNCH])),
  });
  const { user } = renderPage();

  await screen.findByText("Couldn't load the transactions");
  await user.click(screen.getByRole("button", { name: /retry/i }));

  await waitFor(() =>
    expect(screen.getByText("Lunch Place")).toBeInTheDocument()
  );
});
