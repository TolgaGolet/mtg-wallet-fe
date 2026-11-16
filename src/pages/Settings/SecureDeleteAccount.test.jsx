import { screen, waitFor, within } from "@testing-library/react";
import { SecureDeleteAccount } from "./SecureDeleteAccount";
import Settings from "./Settings";
import { ok, renderWithProviders } from "../../test/renderWithProviders";

const mockApi = vi.hoisted(() => ({ get: vi.fn(), delete: vi.fn() }));
vi.mock("../../utils/useAxios", () => ({ default: () => mockApi }));

const renderDialog = (props = {}) => {
  const onClose = vi.fn();
  const onDelete = props.onDelete ?? vi.fn().mockResolvedValue(undefined);
  const view = renderWithProviders(
    <SecureDeleteAccount
      opened
      onClose={onClose}
      twoFactorEnabled={false}
      {...props}
      onDelete={onDelete}
    />
  );
  return { ...view, onClose, onDelete };
};

const passwordInput = () => screen.getByLabelText(/current password/i);
/** Fills a field in one go (one change event instead of one per key). */
const fill = async (user, input, value) => {
  await user.click(input);
  await user.paste(value);
};
const codeInput = () => screen.queryByRole("textbox", { name: /2fa code/i });
/** The dialog's submit button (Settings has its own "Delete Account" button too). */
const deleteButton = () =>
  within(screen.getByRole("dialog")).getByRole("button", {
    name: "Delete Account",
  });

describe("SecureDeleteAccount", () => {
  test("without 2FA only the password is asked for and sent", async () => {
    const { user, onDelete, onClose } = renderDialog();
    expect(codeInput()).toBeNull();

    await fill(user, passwordInput(), "secret");
    await user.click(deleteButton());

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onDelete).toHaveBeenCalledWith({ password: "secret" });
  });

  test("with 2FA the code is sent as verificationCode", async () => {
    const { user, onDelete } = renderDialog({ twoFactorEnabled: true });

    await fill(user, passwordInput(), "secret");
    await fill(user, codeInput(), "123456");
    await user.click(deleteButton());

    await waitFor(() =>
      expect(onDelete).toHaveBeenCalledWith({
        password: "secret",
        verificationCode: "123456",
      })
    );
  });

  test("an empty password blocks the delete", async () => {
    const { user, onDelete } = renderDialog();

    await user.click(deleteButton());

    expect(passwordInput()).toBeRequired();
    expect(onDelete).not.toHaveBeenCalled();
  });

  test("a malformed 2FA code is reported and nothing is deleted", async () => {
    const { user, onDelete } = renderDialog({ twoFactorEnabled: true });

    await fill(user, passwordInput(), "secret");
    await fill(user, codeInput(), "12ab");
    await user.click(deleteButton());

    expect(
      await screen.findByText("Verification code must be a 6-digit number")
    ).toBeVisible();
    expect(onDelete).not.toHaveBeenCalled();
  });

  test("a rejected delete keeps the dialog open so the user can correct it", async () => {
    const onDelete = vi.fn().mockRejectedValue({ response: { status: 400 } });
    const { user, onClose } = renderDialog({ onDelete });

    await fill(user, passwordInput(), "wrong");
    await user.click(deleteButton());

    await waitFor(() => expect(deleteButton()).toBeEnabled());
    expect(onClose).not.toHaveBeenCalled();
    expect(passwordInput()).toHaveValue("wrong");
  });

  // Regression: Cancel and Escape closed the dialog mid-request, which looked like a cancel while
  // the account was still deleted
  test("the dialog can't be closed while the delete is running", async () => {
    let finish;
    const onDelete = vi.fn(() => new Promise((resolve) => (finish = resolve)));
    const { user, onClose } = renderDialog({ onDelete });
    await fill(user, passwordInput(), "secret");

    await user.click(deleteButton());

    await waitFor(() => expect(onDelete).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();

    finish();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  // Regression: the spinner was reset only on failure, so a parent that kept the dialog open after
  // a successful delete was left with a button that spun forever
  test("a successful delete stops the spinner even if the dialog stays open", async () => {
    const { user, onClose } = renderDialog();
    await fill(user, passwordInput(), "secret");

    await user.click(deleteButton());

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    await waitFor(() => expect(deleteButton()).toBeEnabled());
  });
});

describe("deleting the account from Settings", () => {
  const renderSettings = (settings) => {
    mockApi.get
      .mockReset()
      .mockImplementation(() =>
        ok({ email: "ada@example.com", name: "Ada", surname: "", ...settings })
      );
    mockApi.delete.mockReset().mockImplementation(() => ok({}));
    const logoutUser = vi.fn();
    const view = renderWithProviders(<Settings />, {
      auth: { logoutUser, adoptTokens: vi.fn() },
    });
    return { ...view, logoutUser };
  };

  const openDeleteDialog = async (user) => {
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: /email/i })).toHaveValue(
        "ada@example.com"
      )
    );
    await user.click(screen.getByRole("button", { name: /delete account/i }));
    return screen.findByRole("dialog", { name: "Delete Account" });
  };

  test("sends the credentials in the DELETE body and logs out", async () => {
    const { user, logoutUser } = renderSettings({ totpEnabled: false });
    await openDeleteDialog(user);

    await fill(user, passwordInput(), "secret");
    await user.click(deleteButton());

    await waitFor(() =>
      expect(logoutUser).toHaveBeenCalledWith("Your account has been deleted")
    );
    expect(mockApi.delete).toHaveBeenCalledWith("settings/account", {
      data: { password: "secret" },
    });
  });

  // 2FA is known only after settings load, after the dialog's form was created
  test("a user whose 2FA is enabled sends the code once settings have loaded", async () => {
    const { user } = renderSettings({ totpEnabled: true });
    await openDeleteDialog(user);

    await fill(user, passwordInput(), "secret");
    await fill(user, codeInput(), "123456");
    await user.click(deleteButton());

    await waitFor(() =>
      expect(mockApi.delete).toHaveBeenCalledWith("settings/account", {
        data: { password: "secret", verificationCode: "123456" },
      })
    );
  });

  // Regression: the button worked before settings loaded, so a 2FA user got a dialog without the
  // code field and the delete was always refused
  test("Delete Account waits until settings say whether 2FA is on", async () => {
    let finish;
    mockApi.get
      .mockReset()
      .mockImplementation(() => new Promise((resolve) => (finish = resolve)));
    renderWithProviders(<Settings />, {
      auth: { logoutUser: vi.fn(), adoptTokens: vi.fn() },
    });
    const button = screen.getByRole("button", { name: /delete account/i });
    expect(button).toBeDisabled();

    await waitFor(() => expect(mockApi.get).toHaveBeenCalled());
    finish({ data: { email: "ada@example.com", totpEnabled: true } });

    await waitFor(() => expect(button).toBeEnabled());
  });

  test("Delete Account stays off when settings fail to load", async () => {
    mockApi.get
      .mockReset()
      .mockImplementation(() => Promise.reject({ response: { status: 500 } }));
    renderWithProviders(<Settings />, {
      auth: { logoutUser: vi.fn(), adoptTokens: vi.fn() },
    });

    await screen.findByRole("button", { name: /retry/i });
    expect(
      screen.getByRole("button", { name: /delete account/i })
    ).toBeDisabled();
  });

  // Regression: the dialog's form stayed mounted while closed, so a typed password survived Cancel
  // and was still filled in when the dialog was opened again
  test("a password typed before Cancel is gone when the dialog is reopened", async () => {
    const { user } = renderSettings({ totpEnabled: false });
    await openDeleteDialog(user);
    await fill(user, passwordInput(), "secret");

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await openDeleteDialog(user);

    expect(passwordInput()).toHaveValue("");
  });
});
