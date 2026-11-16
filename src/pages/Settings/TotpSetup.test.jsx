import { screen, waitFor } from "@testing-library/react";
import { TotpSetup } from "./TotpSetup";
import showNotification from "../../components/showNotification";
import { ok, renderWithProviders } from "../../test/renderWithProviders";

const mockApi = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("../../utils/useAxios", () => ({ default: () => mockApi }));
vi.mock("../../components/showNotification", () => ({ default: vi.fn() }));

const SETUP = { qrCodeImage: "iVBORw0KGgo=", secret: "SECRETKEY" };

beforeEach(() => {
  vi.mocked(showNotification).mockReset();
  mockApi.post
    .mockReset()
    .mockImplementation((url) =>
      url === "auth/totp/setup" ? ok(SETUP) : ok({})
    );
});

const renderSetup = (twoFactorEnabled) => {
  const close = vi.fn();
  const onChange = vi.fn();
  const adoptTokens = vi.fn();
  const view = renderWithProviders(
    <TotpSetup
      close={close}
      twoFactorEnabled={twoFactorEnabled}
      onChange={onChange}
    />,
    { auth: { adoptTokens } }
  );
  return { ...view, close, onChange, adoptTokens };
};

const enableCode = () =>
  screen.findByRole("textbox", { name: /verification code/i });
const enableButton = () =>
  screen.getByRole("button", { name: /verify and enable/i });
const disableCode = () =>
  screen.getByRole("textbox", { name: /current 2fa code/i });
const disableButton = () =>
  screen.getByRole("button", { name: /verify and disable/i });

describe("enabling 2FA", () => {
  test("shows the QR code and the secret key from the setup request", async () => {
    renderSetup(false);

    expect(await screen.findByAltText("2FA QR Code")).toHaveAttribute(
      "src",
      "data:image/png;base64,iVBORw0KGgo="
    );
    expect(screen.getByText("SECRETKEY")).toBeInTheDocument();
  });

  test("the verify button stays disabled until a 6-digit code is typed", async () => {
    const { user } = renderSetup(false);
    const code = await enableCode();
    const verify = enableButton();

    await user.type(code, "12345");
    expect(verify).toBeDisabled();

    await user.type(code, "6");
    expect(verify).toBeEnabled();
  });

  test("a rejected code keeps the dialog open and the session as it was", async () => {
    mockApi.post.mockImplementation((url) =>
      url === "auth/totp/setup"
        ? ok(SETUP)
        : Promise.reject({ response: { status: 400 } })
    );
    const { user, close, onChange, adoptTokens } = renderSetup(false);
    await user.type(await enableCode(), "123456");

    await user.click(enableButton());

    await waitFor(() => expect(enableButton()).toBeEnabled());
    expect(close).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(adoptTokens).not.toHaveBeenCalled();
  });

  test("a failed setup request offers a retry that loads the QR code", async () => {
    mockApi.post
      .mockImplementationOnce(() => Promise.reject(new Error("Network Error")))
      .mockImplementation(() => ok(SETUP));
    const { user } = renderSetup(false);

    await user.click(await screen.findByRole("button", { name: /retry/i }));

    expect(await screen.findByAltText("2FA QR Code")).toBeInTheDocument();
  });
});

describe("disabling 2FA", () => {
  test("requests no new secret", () => {
    renderSetup(true);

    expect(mockApi.post).not.toHaveBeenCalled();
  });

  test("sends the current code, then closes and reports 2FA as off", async () => {
    const { user, close, onChange } = renderSetup(true);

    await user.type(disableCode(), "654321");
    await user.click(disableButton());

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(false));
    expect(mockApi.post).toHaveBeenCalledWith("auth/totp/disable", {
      code: "654321",
    });
    expect(close).toHaveBeenCalled();
    expect(showNotification).toHaveBeenCalledWith(
      "2FA has been successfully disabled!",
      "success"
    );
  });

  test("a rejected code keeps 2FA on and the form usable", async () => {
    mockApi.post.mockImplementation(() =>
      Promise.reject({ response: { status: 400 } })
    );
    const { user, close, onChange } = renderSetup(true);

    await user.type(disableCode(), "654321");
    await user.click(disableButton());

    await waitFor(() => expect(disableButton()).toBeEnabled());
    expect(close).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
