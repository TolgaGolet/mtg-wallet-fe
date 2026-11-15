import { screen } from "@testing-library/react";
import PagedEntityList from "./PagedEntityList";
import { page, renderWithProviders } from "../test/renderWithProviders";

const mockApi = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("../utils/useAxios", () => ({ default: () => mockApi }));

const renderList = () =>
  renderWithProviders(
    <PagedEntityList
      title="Payees"
      entity="payee"
      basePath="/payees"
      singularLabel="Payee"
      limit={3}
      getSubtitle={(item) => item.categoryName}
    />
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
