import { screen, waitFor } from "@testing-library/react";
import Settings from "./Settings";
import { ok, renderWithProviders } from "../../test/renderWithProviders";

const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("../../utils/useAxios", () => ({ default: () => mockApi }));

const SETTINGS = {
  email: "ada@example.com",
  name: "Ada",
  surname: null, // registration allows no surname
  totpEnabled: false,
};

beforeEach(() => {
  mockApi.get.mockReset().mockImplementation(() => ok(SETTINGS));
  mockApi.post.mockReset().mockImplementation(() => ok({}));
});

const renderSettings = () =>
  renderWithProviders(<Settings />, { auth: { logoutUser: vi.fn() } });

// Regression (F10): the whole settings object was sent back, so a null surname hit
// UpdateSettingsRequest's @NotNull and every save answered 400
test("saving sends only email, name and surname, with an empty surname as ''", async () => {
  const { user } = renderSettings();
  await waitFor(() =>
    expect(screen.getByRole("textbox", { name: /email/i })).toHaveValue(
      "ada@example.com"
    )
  );
  await user.click(screen.getByRole("button", { name: "Save Settings" }));
  await waitFor(() =>
    expect(mockApi.post).toHaveBeenCalledWith("settings/update", {
      email: "ada@example.com",
      name: "Ada",
      surname: "",
    })
  );
});

// Regression (F12): reopening the dialog showed the passwords typed before
test("closing the change-password dialog clears the typed passwords", async () => {
  const { user } = renderSettings();
  await user.click(
    await screen.findByRole("button", { name: "Change Password" })
  );
  const current = await screen.findByLabelText(/current password/i);
  await user.type(current, "Secret123!");
  expect(current).toHaveValue("Secret123!");

  await user.keyboard("{Escape}");
  await waitFor(() =>
    expect(screen.queryByLabelText(/current password/i)).toBeNull()
  );

  await user.click(screen.getByRole("button", { name: "Change Password" }));
  expect(await screen.findByLabelText(/current password/i)).toHaveValue("");
});

// F11: the switch used to have no accessible name
test("the 2FA switch has a label", async () => {
  renderSettings();
  expect(
    await screen.findByRole("switch", {
      name: /two-factor authentication/i,
    })
  ).toBeInTheDocument();
});
