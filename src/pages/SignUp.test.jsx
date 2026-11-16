import { screen, waitFor } from "@testing-library/react";
import SignUp from "./SignUp";
import { renderWithProviders } from "../test/renderWithProviders";

const VALID_PASSWORD = "Str0ng!Pass";

const renderSignUp = (
  signUpUser = vi.fn().mockResolvedValue({}),
  user = null
) => ({
  ...renderWithProviders(<SignUp />, {
    route: "/sign-up",
    auth: { user, signUpUser },
  }),
  signUpUser,
});

/** Fills a field in one go; typing key by key re-validates on every character. */
async function fill(user, input, value) {
  await user.click(input);
  await user.paste(value);
}

async function fillForm(user, overrides = {}) {
  const values = {
    username: "adal",
    email: "ada@example.com",
    name: "Ada",
    password: VALID_PASSWORD,
    confirmPassword: VALID_PASSWORD,
    ...overrides,
  };
  await fill(
    user,
    screen.getByRole("textbox", { name: /username/i }),
    values.username
  );
  await fill(
    user,
    screen.getByRole("textbox", { name: /email/i }),
    values.email
  );
  await fill(
    user,
    screen.getByRole("textbox", { name: /^name/i }),
    values.name
  );
  await fill(user, screen.getByLabelText(/^password/i), values.password);
  await fill(
    user,
    screen.getByLabelText(/confirm password/i),
    values.confirmPassword
  );
}

test("a valid sign-up sends the form and confirms with a dialog that goes home", async () => {
  const { user, location, signUpUser } = renderSignUp();

  await fillForm(user);
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  await screen.findByText("Registration successful");
  expect(signUpUser).toHaveBeenCalledWith(
    expect.objectContaining({
      username: "adal",
      email: "ada@example.com",
      name: "Ada",
      surname: "",
      password: VALID_PASSWORD,
    })
  );

  await user.click(screen.getByRole("button", { name: "Okay" }));
  expect(location()).toBe("/");
});

test("mismatched passwords are reported and nothing is sent", async () => {
  const { user, signUpUser } = renderSignUp();

  await fillForm(user, { confirmPassword: `${VALID_PASSWORD}x` });
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(await screen.findByText("Passwords do not match")).toBeVisible();
  expect(signUpUser).not.toHaveBeenCalled();
});

test("a weak password is rejected before anything is sent", async () => {
  const { user, signUpUser } = renderSignUp();

  await fillForm(user, { password: "short", confirmPassword: "short" });
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(
    await screen.findByText(/Password must be 8-64 characters/)
  ).toBeVisible();
  expect(signUpUser).not.toHaveBeenCalled();
});

test("the server's error (e.g. a taken username) stays on the form", async () => {
  const signUpUser = vi.fn().mockRejectedValue({
    response: { status: 409, data: "An error occurred: Username is taken." },
  });
  const { user } = renderSignUp(signUpUser);

  await fillForm(user);
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(
    await screen.findByText("An error occurred: Username is taken.")
  ).toBeVisible();
  expect(screen.getByRole("button", { name: "Sign up" })).toBeEnabled();
  expect(screen.queryByText("Registration successful")).toBeNull();
});

test("a network error without a message shows no empty error box", async () => {
  const signUpUser = vi.fn().mockRejectedValue(new Error("Network Error"));
  const { user } = renderSignUp(signUpUser);

  await fillForm(user);
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Sign up" })).toBeEnabled()
  );
  expect(screen.queryByText("Error")).toBeNull();
});

test("a logged-in user is sent home", () => {
  const { location } = renderSignUp(vi.fn(), { sub: "ada" });

  expect(location()).toBe("/");
});
