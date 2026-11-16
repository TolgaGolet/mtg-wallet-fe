import { screen, waitFor } from "@testing-library/react";
import CreateOrEditPayee from "./CreateOrEditPayee";
import showNotification from "../../components/showNotification";
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
vi.mock("../../components/showNotification", () => ({ default: vi.fn() }));

const ENUMS = {
  categoryList: [
    { id: 10, name: "Food" },
    { id: 11, name: "Gas", parentCategory: { name: "Auto" } },
  ],
};
const PAYEE = { id: 7, name: "Market", categoryId: 10 };

beforeEach(() => {
  vi.mocked(showNotification).mockReset();
  mockApi.get.mockReset().mockImplementation(() => ok(ENUMS));
  mockApi.post
    .mockReset()
    .mockImplementation((url) =>
      url === "payee/search" ? page([PAYEE]) : ok({})
    );
  mockApi.put.mockReset().mockImplementation(() => ok({}));
  mockApi.delete.mockReset().mockImplementation(() => ok({}));
});

const renderPage = (id = "create", history = []) =>
  renderWithProviders(<CreateOrEditPayee />, {
    route: `/payees/create-or-edit/${id}`,
    path: "/payees/create-or-edit/:payeeId",
    history,
  });

const nameInput = () => screen.getByRole("textbox", { name: /name/i });
const categoryInput = () => screen.getByRole("textbox", { name: /category/i });

test("create sends the name and the category id as a number, then goes to the list", async () => {
  const { user, location } = renderPage();
  await screen.findByRole("button", { name: "Create" });

  await user.type(nameInput(), "Bakery");
  await pickOption(user, /category/i, "Food");
  await user.click(screen.getByRole("button", { name: "Create" }));

  await waitFor(() => expect(location()).toBe("/payees"));
  expect(mockApi.post).toHaveBeenCalledWith("payee/create", {
    name: "Bakery",
    categoryId: 10,
  });
  expect(showNotification).toHaveBeenCalledWith(
    "Payee created successfully",
    "success"
  );
});

test("an invalid name is reported and nothing is sent", async () => {
  const { user } = renderPage();
  await screen.findByRole("button", { name: "Create" });

  await user.type(nameInput(), "Ab");
  await pickOption(user, /category/i, "Food");
  await user.click(screen.getByRole("button", { name: "Create" }));

  expect(
    await screen.findByText(/Name must be 3-50 characters long/)
  ).toBeInTheDocument();
  expect(mockApi.post).not.toHaveBeenCalledWith(
    "payee/create",
    expect.anything()
  );
});

test("edit fills the form and locks the category, which a payee can't change", async () => {
  renderPage("7");

  await waitFor(() => expect(nameInput()).toHaveValue("Market"));
  expect(categoryInput()).toHaveValue("Food");
  expect(categoryInput()).toBeDisabled();
  expect(mockApi.post).toHaveBeenCalledWith(
    "payee/search",
    { id: "7" },
    expect.objectContaining({ params: { pageNo: 0 } })
  );
});

test("an update sends only the name; opened directly it goes to the list", async () => {
  const { user, location } = renderPage("7");
  await waitFor(() => expect(nameInput()).toHaveValue("Market"));

  await user.clear(nameInput());
  await user.type(nameInput(), "Super Market");
  await user.click(screen.getByRole("button", { name: "Save" }));

  await waitFor(() => expect(location()).toBe("/payees"));
  expect(mockApi.put).toHaveBeenCalledWith("payee/update/7", {
    name: "Super Market",
  });
  expect(showNotification).toHaveBeenCalledWith(
    "Payee updated successfully",
    "success"
  );
});

test("an update opened from another page goes back to that page", async () => {
  const { user, location } = renderPage("7", ["/transactions"]);
  await waitFor(() => expect(nameInput()).toHaveValue("Market"));

  await user.click(screen.getByRole("button", { name: "Save" }));

  await waitFor(() => expect(location()).toBe("/transactions"));
});

test("a failed save stays on the form and lets the user try again", async () => {
  mockApi.put.mockImplementation(() =>
    Promise.reject({ response: { status: 409 } })
  );
  const { user, location } = renderPage("7");
  await waitFor(() => expect(nameInput()).toHaveValue("Market"));

  await user.click(screen.getByRole("button", { name: "Save" }));

  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled()
  );
  expect(location()).toBe("/payees/create-or-edit/7");
  expect(showNotification).not.toHaveBeenCalled();
});

test("delete is sent only after confirming, then goes to the list", async () => {
  const { user, location } = renderPage("7");
  await waitFor(() => expect(nameInput()).toHaveValue("Market"));

  await user.click(screen.getByRole("button", { name: "Delete this payee" }));
  expect(
    await screen.findByText(/This action won't delete your transactions/)
  ).toBeInTheDocument();
  expect(mockApi.delete).not.toHaveBeenCalled();

  await user.click(screen.getByRole("button", { name: "Confirm" }));

  await waitFor(() => expect(location()).toBe("/payees"));
  expect(mockApi.delete).toHaveBeenCalledWith("payee/delete/7");
});

test("cancelling the delete confirmation sends nothing", async () => {
  const { user, location } = renderPage("7");
  await waitFor(() => expect(nameInput()).toHaveValue("Market"));

  await user.click(screen.getByRole("button", { name: "Delete this payee" }));
  await user.click(await screen.findByRole("button", { name: "Cancel" }));

  expect(mockApi.delete).not.toHaveBeenCalled();
  expect(location()).toBe("/payees/create-or-edit/7");
});

test("a failed load shows a retry, and retrying loads the form", async () => {
  mockApi.get
    .mockImplementationOnce(() => Promise.reject(new Error("Network Error")))
    .mockImplementation(() => ok(ENUMS));
  const { user } = renderPage("7");

  await user.click(await screen.findByRole("button", { name: /retry/i }));

  await waitFor(() => expect(nameInput()).toHaveValue("Market"));
});
