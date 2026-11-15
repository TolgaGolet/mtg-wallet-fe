import { screen, waitFor } from "@testing-library/react";
import Transactions from "./Transactions";
import { page, renderWithProviders } from "../../test/renderWithProviders";

const mockApi = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("../../utils/useAxios", () => ({ default: () => mockApi }));

const TRANSACTION = {
  id: 7,
  dateTime: "2026-11-01T10:00:00",
  amount: 12.5,
  type: { value: "EXP", label: "Expense" },
  payee: { id: 1, name: "Market", category: { id: 2, name: "Groceries" } },
  sourceAccount: { id: 3, name: "Cash", currency: { value: "TRY" } },
};

const transactionSearchCalls = () =>
  mockApi.post.mock.calls.filter(([url]) => url === "transaction/search");

beforeEach(() => {
  mockApi.post.mockReset();
});

// Regression (code quality F4): an emptied last page showed "No transactions found" with the
// pagination hidden, and no way back
test("deleting the last transaction on the last page moves to the previous page", async () => {
  mockApi.post.mockImplementation((url, body, { params } = {}) => {
    if (url === "account/search") return page([]);
    // Page 3 (pageNo 2) was emptied by a delete; two pages are left
    return params.pageNo === 2
      ? page([], { totalPages: 2, totalElements: 20 })
      : page([TRANSACTION], { totalPages: 2, totalElements: 20 });
  });
  renderWithProviders(<Transactions />, { route: "/transactions?page=3" });

  expect(await screen.findByText("Market")).toBeInTheDocument();
  expect(transactionSearchCalls().map(([, , config]) => config.params)).toEqual(
    [{ pageNo: 2 }, { pageNo: 1 }]
  );
  expect(screen.getByRole("button", { name: "2" })).toHaveAttribute(
    "aria-current",
    "page"
  );
});

test("the page comes from the URL, and one page shows no pagination", async () => {
  mockApi.post.mockImplementation(() => page([TRANSACTION]));
  renderWithProviders(<Transactions />, { route: "/transactions" });

  expect(await screen.findByText("Market")).toBeInTheDocument();
  await waitFor(() =>
    expect(transactionSearchCalls()[0][2].params).toEqual({ pageNo: 0 })
  );
  expect(screen.queryByRole("button", { name: "1" })).toBeNull();
});

// Regression: the page was in the URL but the filter only in state, so a refresh loaded the same
// page of the unfiltered list
test("a refresh keeps the filter together with its page", async () => {
  mockApi.post.mockImplementation(() =>
    page([TRANSACTION], { totalPages: 3, totalElements: 30 })
  );
  const filter = encodeURIComponent(JSON.stringify({ notes: "rent" }));
  renderWithProviders(<Transactions />, {
    route: `/transactions?page=2&filter=${filter}`,
  });

  expect(await screen.findByText("Market")).toBeInTheDocument();
  const [, body, config] = transactionSearchCalls()[0];
  expect(body.notes).toBe("rent");
  expect(config.params).toEqual({ pageNo: 1 });
  expect(transactionSearchCalls()).toHaveLength(1);
  expect(screen.getByLabelText("Notes")).toHaveValue("rent");
});
