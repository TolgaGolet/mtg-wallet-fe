import { screen, waitFor } from "@testing-library/react";
import PageTitle from "./PageTitle";
import { renderWithProviders } from "../test/renderWithProviders";

afterEach(() => {
  window.history.replaceState(null, "");
});

// Regression: history.back() left the app when the page was opened directly (e.g. a bookmark)
test("without in-app history, the back button goes to the parent page", async () => {
  window.history.replaceState({ idx: 0 }, "");
  const { user, location } = renderWithProviders(
    <PageTitle isBackButtonVisible value="Edit Payee" backTo="/payees" />,
    { route: "/payees/create-or-edit/7" }
  );
  await user.click(screen.getByRole("button", { name: "Go back" }));
  await waitFor(() => expect(location()).toBe("/payees"));
});

test("the back button defaults to Home", async () => {
  const { user, location } = renderWithProviders(
    <PageTitle isBackButtonVisible value="Transactions" />,
    { route: "/transactions" }
  );
  await user.click(screen.getByRole("button", { name: "Go back" }));
  await waitFor(() => expect(location()).toBe("/"));
});
