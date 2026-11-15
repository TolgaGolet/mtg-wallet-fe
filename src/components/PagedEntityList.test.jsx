import { screen, waitFor } from "@testing-library/react";
import PagedEntityList from "./PagedEntityList";
import { page, renderWithProviders } from "../test/renderWithProviders";

const mockApi = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("../utils/useAxios", () => ({ default: () => mockApi }));

beforeEach(() => {
  mockApi.post.mockReset();
});

const renderList = (route = "/payees") =>
  renderWithProviders(
    <PagedEntityList
      title="Payees"
      entity="payee"
      basePath="/payees"
      singularLabel="Payee"
      limit={3}
      getSubtitle={(item) => item.categoryName}
    />,
    { route }
  );

// totalElements counts every page; the current page alone would miss the limit
test("'limit reached' uses totalElements, not the size of the current page", async () => {
  mockApi.post.mockImplementation(() =>
    page([{ id: 1, name: "Market" }], { totalElements: 3, totalPages: 3 })
  );
  renderList();
  expect(
    await screen.findByRole("button", { name: "Payee limit reached" })
  ).toBeDisabled();
});

test("below the limit, Add links to the create form", async () => {
  mockApi.post.mockImplementation(() =>
    page([{ id: 1, name: "Market", categoryName: "Groceries" }])
  );
  renderList();
  expect(await screen.findByRole("link", { name: "Add" })).toHaveAttribute(
    "href",
    "/payees/create-or-edit/create"
  );
  expect(
    screen.getByRole("link", { name: "Edit payee Market, Groceries" })
  ).toHaveAttribute("href", "/payees/create-or-edit/1");
});

// An empty list used to look like an error (a red alert)
test("an empty list is an informational message, not an error", async () => {
  mockApi.post.mockImplementation(() => page([]));
  renderList();
  expect(await screen.findByText("No payees yet")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).toBeNull();
});

// Code quality F5: the page lived in component state, so coming back from an edit form showed page 1
test("the page is read from ?page=, so returning to the list keeps it", async () => {
  mockApi.post.mockImplementation(() =>
    page([{ id: 11, name: "Bakery" }], { totalPages: 3, totalElements: 21 })
  );
  renderList("/payees?page=2");
  expect(await screen.findByText("Bakery")).toBeInTheDocument();
  expect(mockApi.post).toHaveBeenCalledWith(
    "payee/search",
    {},
    expect.objectContaining({ params: { pageNo: 1 } })
  );
  expect(screen.getByRole("button", { name: "2" })).toHaveAttribute(
    "aria-current",
    "page"
  );
});

test("picking a page loads it", async () => {
  mockApi.post.mockImplementation(() =>
    page([{ id: 1, name: "Market" }], { totalPages: 3, totalElements: 21 })
  );
  const { user } = renderList();
  await user.click(await screen.findByRole("button", { name: "3" }));
  await waitFor(() =>
    expect(mockApi.post).toHaveBeenLastCalledWith(
      "payee/search",
      {},
      expect.objectContaining({ params: { pageNo: 2 } })
    )
  );
});

test("a single page shows no pagination", async () => {
  mockApi.post.mockImplementation(() => page([{ id: 1, name: "Market" }]));
  renderList();
  expect(await screen.findByText("Market")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "1" })).toBeNull();
});
