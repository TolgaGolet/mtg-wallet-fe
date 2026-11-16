import { screen } from "@testing-library/react";
import PrivateRoute from "./PrivateRoute";
import { renderWithProviders } from "../test/renderWithProviders";

test.each([
  ["a logged-out visitor is sent to /login", null, "/login", false],
  [
    "a logged-in user sees the protected children",
    { sub: "ada" },
    "/accounts",
    true,
  ],
])("%s", (_name, user, expectedPath, showsChildren) => {
  const { location } = renderWithProviders(
    <PrivateRoute>
      <p>Secret</p>
    </PrivateRoute>,
    { route: "/accounts", auth: { user } }
  );

  expect(location()).toBe(expectedPath);
  expect(screen.queryByText("Secret") !== null).toBe(showsChildren);
});
