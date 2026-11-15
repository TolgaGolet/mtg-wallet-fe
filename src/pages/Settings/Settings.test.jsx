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

const renderSettings = (auth = {}) =>
  renderWithProviders(<Settings />, {
    auth: { logoutUser: vi.fn(), adoptTokens: vi.fn(), ...auth },
  });

const ROTATED_TOKENS = {
  accessToken: "new-access",
  refreshToken: "new-refresh",
};

/** The 2FA setup endpoints: a QR code, then the fresh token pair verify-setup answers. */
const mockTotpSetup = () =>
  mockApi.post.mockImplementation((url) => {
    if (url === "auth/totp/setup") {
      return ok({ qrCodeImage: "iVBORw0KGgo=", secret: "SECRETKEY" });
    }
    if (url === "auth/totp/verify-setup") {
      return ok(ROTATED_TOKENS);
    }
    return ok({});
  });

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

// Regression (code quality F1): verify-setup revokes every session and answers new tokens; the
// page kept the revoked ones, so the next request logged the user out
test("enabling 2FA keeps the user signed in with the rotated tokens", async () => {
  mockTotpSetup();
  const adoptTokens = vi.fn();
  const { user } = renderSettings({ adoptTokens });
  await user.click(
    await screen.findByRole("switch", { name: /two-factor authentication/i })
  );
  await user.type(
    await screen.findByRole("textbox", { name: "Verification Code" }),
    "123456"
  );
  await user.click(
    screen.getByRole("button", { name: "Verify and Enable 2FA" })
  );

  await waitFor(() => expect(adoptTokens).toHaveBeenCalledWith(ROTATED_TOKENS));
  expect(mockApi.post).toHaveBeenCalledWith("auth/totp/verify-setup", {
    code: "123456",
  });
  await waitFor(() =>
    expect(
      screen.getByRole("switch", { name: /two-factor authentication/i })
    ).toBeChecked()
  );
});

// The dialog used to have no title, so it had no accessible name
test("the 2FA dialog has an accessible name", async () => {
  mockTotpSetup();
  const { user } = renderSettings();
  await user.click(
    await screen.findByRole("switch", { name: /two-factor authentication/i })
  );
  expect(
    await screen.findByRole("dialog", {
      name: "Set up two-factor authentication",
    })
  ).toBeInTheDocument();
});
