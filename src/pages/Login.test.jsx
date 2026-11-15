import { screen, waitFor } from "@testing-library/react";
import Login from "./Login";
import showNotification from "../components/showNotification";
import { renderWithProviders } from "../test/renderWithProviders";

vi.mock("../components/showNotification", () => ({ default: vi.fn() }));

const renderLogin = (loginUser) =>
  renderWithProviders(<Login />, {
    route: "/login",
    auth: { user: null, loginUser },
  });

async function signIn(user) {
  await user.type(screen.getByRole("textbox", { name: /username/i }), "ada");
  await user.type(screen.getByLabelText(/password/i), "secret");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
}

test("a successful sign-in confirms with a toast", async () => {
  const loginUser = vi.fn().mockResolvedValue({ status: "ok" });
  const { user } = renderLogin(loginUser);
  await signIn(user);
  expect(loginUser).toHaveBeenCalledWith({
    username: "ada",
    password: "secret",
    verificationCode: "",
  });
  await waitFor(() =>
    expect(showNotification).toHaveBeenCalledWith(
      "You have been successfully signed in",
      "success"
    )
  );
});

test("the 2FA step submits once, as soon as the 6-digit code is typed", async () => {
  const loginUser = vi
    .fn()
    .mockResolvedValueOnce({ status: "totp" })
    .mockResolvedValueOnce({ status: "ok" });
  const { user } = renderLogin(loginUser);
  await signIn(user);

  const code = await screen.findByRole("textbox", {
    name: /verification code/i,
  });
  await user.type(code, "123456");

  await waitFor(() => expect(loginUser).toHaveBeenCalledTimes(2));
  expect(loginUser).toHaveBeenLastCalledWith(
    expect.objectContaining({
      username: "ada",
      password: "secret",
      verificationCode: "123456",
    })
  );
});

test("an unverified email shows the error and offers to resend the link", async () => {
  const loginUser = vi.fn().mockResolvedValue({
    status: "error",
    message: "An error occurred: Email is not verified.",
    isEmailVerificationRequired: true,
  });
  const { user } = renderLogin(loginUser);
  await signIn(user);

  expect(
    await screen.findByText("An error occurred: Email is not verified.")
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: /didn't receive a verification link/i })
  );
  expect(screen.getByRole("button", { name: "Resend" })).toBeInTheDocument();
});

test("a wrong password shows the server's message without the resend link", async () => {
  const loginUser = vi.fn().mockResolvedValue({
    status: "error",
    message: "An error occurred: Bad credentials.",
    isEmailVerificationRequired: false,
  });
  const { user } = renderLogin(loginUser);
  await signIn(user);

  expect(
    await screen.findByText("An error occurred: Bad credentials.")
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", {
      name: /didn't receive a verification link/i,
    })
  ).toBeNull();
});
