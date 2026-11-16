import { screen, waitFor } from "@testing-library/react";
import AccountRecovery from "./AccountRecovery";
import { renderWithProviders } from "../test/renderWithProviders";
import { publicApi } from "../api/client";

let post;
beforeEach(() => {
  post = vi
    .spyOn(publicApi, "post")
    .mockReset()
    .mockResolvedValue({ data: {} });
});

const renderPage = (user = null) =>
  renderWithProviders(<AccountRecovery />, {
    route: "/account-recovery",
    auth: { user },
  });

async function fillForm(user, username = "adal") {
  await user.click(screen.getByRole("textbox", { name: /username/i }));
  await user.paste(username);
  await user.click(screen.getByLabelText(/^password/i));
  await user.paste("secret");
}

test("requests a recovery link with the credentials and confirms it was sent", async () => {
  const { user, location } = renderPage();

  await fillForm(user);
  await user.click(screen.getByRole("button", { name: "Send" }));

  await screen.findByText("Link sent");
  expect(post).toHaveBeenCalledWith("auth/account-recovery/request", {
    username: "adal",
    password: "secret",
  });
  await user.click(screen.getByRole("button", { name: "Okay" }));
  expect(location()).toBe("/");
});

test("an invalid username is reported and nothing is sent", async () => {
  const { user } = renderPage();

  await fillForm(user, "ada_l");
  await user.click(screen.getByRole("button", { name: "Send" }));

  await waitFor(() =>
    expect(screen.getByRole("textbox", { name: /username/i })).toHaveAttribute(
      "aria-invalid",
      "true"
    )
  );
  expect(post).not.toHaveBeenCalled();
});

test("a failed request re-enables the form and shows no success dialog", async () => {
  post.mockRejectedValue({ response: { status: 400 } });
  const { user } = renderPage();

  await fillForm(user);
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
