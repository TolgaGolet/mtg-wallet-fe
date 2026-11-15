import { screen, waitFor } from "@testing-library/react";
import CreateOrEditCategory from "./CreateOrEditCategory";
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

const ENUMS = {
  transactionTypes: [
    { value: "EXP", label: "Expense" },
    { value: "INC", label: "Income" },
  ],
  parentCategoryList: [
    { value: "3", label: "Food", transactionType: { value: "EXP" } },
    { value: "4", label: "Investment", transactionType: { value: "INC" } },
  ],
};

beforeEach(() => {
  mockApi.get.mockReset().mockImplementation(() => ok(ENUMS));
  mockApi.post.mockReset().mockImplementation(() => ok({}));
  mockApi.put.mockReset().mockImplementation(() => ok({}));
});

const renderPage = (id = "create") =>
  renderWithProviders(<CreateOrEditCategory />, {
    route: `/categories/create-or-edit/${id}`,
    path: "/categories/create-or-edit/:categoryId",
  });

// Regression (F2): the reset was on onSelect (a DOM text-selection event), so the Expense parent
// stayed selected after switching to Income and the backend rejected the create
test("changing the transaction type clears the parent category", async () => {
  const { user } = renderPage();
  await screen.findByRole("textbox", { name: /parent category/i });

  await user.type(screen.getByRole("textbox", { name: /name/i }), "Coffee");
  await pickOption(user, /parent category/i, "Food");
  expect(screen.getByRole("textbox", { name: /parent category/i })).toHaveValue(
    "Food"
  );

  await pickOption(user, /transaction type/i, "Income");
  expect(screen.getByRole("textbox", { name: /parent category/i })).toHaveValue(
    ""
  );

  await user.click(screen.getByRole("button", { name: "Create" }));
  await waitFor(() =>
    expect(mockApi.post).toHaveBeenCalledWith("category/create", {
      name: "Coffee",
      transactionTypeValue: "INC",
      parentCategoryId: null,
    })
  );
});

test("the parent list only offers categories of the selected type", async () => {
  const { user } = renderPage();
  await user.click(
    await screen.findByRole("textbox", { name: /parent category/i })
  );
  expect(screen.getByRole("option", { name: "Food" })).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: "Investment" })).toBeNull();
});

// Regression (F3): a deleted or foreign id opened an empty form in edit mode
test("a category that doesn't exist shows 'not found' instead of a form", async () => {
  mockApi.post.mockImplementation(() => page([]));
  renderPage("99");
  expect(await screen.findByText("Category not found")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
});

test("an update sends only the name and the parent", async () => {
  mockApi.post.mockImplementation(() =>
    page([
      {
        id: 5,
        name: "Coffee",
        transactionType: { value: "EXP" },
        parentCategoryId: 3,
        isParent: false,
        status: { value: "A" },
      },
    ])
  );
  const { user, location } = renderPage("5");
  await waitFor(() =>
    expect(screen.getByRole("textbox", { name: /name/i })).toHaveValue("Coffee")
  );
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(mockApi.put).toHaveBeenCalledWith("category/update/5", {
      name: "Coffee",
      parentCategoryId: 3,
    })
  );
  await waitFor(() => expect(location()).toBe("/categories"));
});
