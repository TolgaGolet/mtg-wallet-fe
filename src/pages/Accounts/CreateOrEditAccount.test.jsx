import { screen, waitFor } from "@testing-library/react";
import { Route, Routes, useNavigate } from "react-router-dom";
import CreateOrEditAccount from "./CreateOrEditAccount";
import { ok, page, renderWithProviders } from "../../test/renderWithProviders";

const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("../../utils/useAxios", () => ({ default: () => mockApi }));

const ENUMS = {
  accountTypes: [{ value: "CASH", label: "Cash" }],
  currencies: [{ value: "TRY", label: "Turkish Lira" }],
};

const ACCOUNT = {
  id: 7,
  name: "Wallet",
  type: { value: "CASH", label: "Cash" },
  balance: 120.5,
  currency: { value: "TRY", label: "Turkish Lira" },
  status: { value: "A" },
  userId: 1,
  version: 3,
};

beforeEach(() => {
  mockApi.get.mockReset().mockImplementation(() => ok(ENUMS));
  mockApi.post.mockReset().mockImplementation(() => page([ACCOUNT]));
  mockApi.put.mockReset().mockImplementation(() => ok({}));
  mockApi.delete.mockReset().mockImplementation(() => ok({}));
});

const renderPage = (id) =>
  renderWithProviders(<CreateOrEditAccount />, {
    route: `/accounts/create-or-edit/${id}`,
    path: "/accounts/create-or-edit/:accountId",
  });

// Regression (F10): the update sent the whole server object (id, balance, version, ...)
test("an update sends only the fields AccountUpdateRequest accepts", async () => {
  const { user, location } = renderPage("7");
  await waitFor(() =>
    expect(screen.getByRole("textbox", { name: /name/i })).toHaveValue("Wallet")
  );
  await user.clear(screen.getByRole("textbox", { name: /name/i }));
  await user.type(screen.getByRole("textbox", { name: /name/i }), "Pocket");
  await user.click(screen.getByRole("button", { name: "Save" }));

  await waitFor(() =>
    expect(mockApi.put).toHaveBeenCalledWith("account/update/7", {
      name: "Pocket",
      typeValue: "CASH",
    })
  );
  await waitFor(() => expect(location()).toBe("/accounts/7"));
});

// Regression: Save replaced the edit page with a second copy of the detail page it was opened
// from, so the detail page's back button landed on the same page
test("an update opened from the detail page goes back to it", async () => {
  function DetailPage() {
    const navigate = useNavigate();
    return (
      <button type="button" onClick={() => navigate(-1)}>
        back
      </button>
    );
  }
  const { user, location } = renderWithProviders(
    <Routes>
      <Route
        path="/accounts/create-or-edit/:accountId"
        element={<CreateOrEditAccount />}
      />
      <Route path="/accounts/7" element={<DetailPage />} />
    </Routes>,
    {
      route: "/accounts/create-or-edit/7",
      history: ["/accounts", "/accounts/7"],
    }
  );
  await waitFor(() =>
    expect(screen.getByRole("textbox", { name: /name/i })).toHaveValue("Wallet")
  );
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(location()).toBe("/accounts/7"));

  // One step back reaches the list, not another copy of the detail page
  await user.click(screen.getByRole("button", { name: "back" }));
  expect(location()).toBe("/accounts");
});

test("delete asks for confirmation, then goes back to the list", async () => {
  const { user, location } = renderPage("7");
  await user.click(
    await screen.findByRole("button", { name: "Delete this account" })
  );
  await user.click(await screen.findByRole("button", { name: "Confirm" }));
  await waitFor(() =>
    expect(mockApi.delete).toHaveBeenCalledWith("account/delete/7")
  );
  await waitFor(() => expect(location()).toBe("/accounts"));
});

test("a missing account shows 'not found'", async () => {
  mockApi.post.mockImplementation(() => page([]));
  renderPage("404");
  expect(await screen.findByText("Account not found")).toBeInTheDocument();
});
