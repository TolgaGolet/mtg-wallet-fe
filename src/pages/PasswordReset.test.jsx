import { screen, waitFor } from "@testing-library/react";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import { renderWithProviders } from "../test/renderWithProviders";
import { publicApi } from "../api/client";

const VALID_PASSWORD = "Str0ng!Pass";

let post;
beforeEach(() => {
  post = vi
    .spyOn(publicApi, "post")
    .mockReset()
    .mockResolvedValue({ data: {} });
});

describe("ForgotPassword", () => {
  const renderPage = (user = null) =>
    renderWithProviders(<ForgotPassword />, {
      route: "/forgot-password",
      auth: { user },
    });

  const emailInput = () => screen.getByRole("textbox", { name: /email/i });

  const typeEmail = async (user, email) => {
    await user.click(emailInput());
    await user.paste(email);
  };

  test("requests a reset link for the email and confirms it was sent", async () => {
    const { user, location } = renderPage();

    await typeEmail(user, "ada@example.com");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await screen.findByText("Link sent");
    expect(post).toHaveBeenCalledWith("auth/password-reset/request", {
      email: "ada@example.com",
    });
    await user.click(screen.getByRole("button", { name: "Okay" }));
    expect(location()).toBe("/");
  });

  test("an invalid email is reported and nothing is sent", async () => {
    const { user } = renderPage();

    await typeEmail(user, "nope");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(emailInput()).toHaveAttribute("aria-invalid", "true")
    );
    expect(post).not.toHaveBeenCalled();
  });

  test("a failed request re-enables the form and shows no success dialog", async () => {
    post.mockRejectedValue({ response: { status: 500 } });
    const { user } = renderPage();

    await typeEmail(user, "ada@example.com");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Send" })).toBeEnabled()
    );
    expect(screen.queryByText("Link sent")).toBeNull();
  });

  test("a logged-in user is sent home", () => {
    const { location } = renderPage({ sub: "ada" });

    expect(location()).toBe("/");
  });
});

describe("ResetPassword", () => {
  const renderPage = (user = null) =>
    renderWithProviders(<ResetPassword />, {
      route: "/reset-password/tok-123",
      path: "/reset-password/:token",
      auth: { user },
    });

  const typePasswords = async (user, password, confirm = password) => {
    await user.click(screen.getByLabelText(/^password/i));
    await user.paste(password);
    await user.click(screen.getByLabelText(/confirm password/i));
    await user.paste(confirm);
  };

  test("posts only the new password to the token's reset endpoint", async () => {
    const { user, location } = renderPage();

    await typePasswords(user, VALID_PASSWORD);
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await screen.findByText("Password reset successful");
    expect(post).toHaveBeenCalledWith("auth/password-reset/reset/tok-123", {
      password: VALID_PASSWORD,
    });
    await user.click(screen.getByRole("button", { name: "Okay" }));
    expect(location()).toBe("/");
  });

  test("mismatched passwords are reported and nothing is sent", async () => {
    const { user } = renderPage();

    await typePasswords(user, VALID_PASSWORD, "Different1!");
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(await screen.findByText("Passwords do not match")).toBeVisible();
    expect(post).not.toHaveBeenCalled();
  });

  test("an expired or used token keeps the form for another try", async () => {
    post.mockRejectedValue({
      response: { status: 400, data: "An error occurred: Invalid token." },
    });
    const { user } = renderPage();

    await typePasswords(user, VALID_PASSWORD);
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled()
    );
    expect(screen.queryByText("Password reset successful")).toBeNull();
  });

  test("a logged-in user is sent home", () => {
    const { location } = renderPage({ sub: "ada" });

    expect(location()).toBe("/");
  });
});
