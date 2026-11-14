import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { DatesProvider } from "@mantine/dates";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";

/** Shows the current path, so tests can assert where a page navigated to. */
function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

/**
 * Renders `ui` inside the app's providers and a memory router.
 * - `route`: the URL to start at; `path`: the route pattern that renders `ui` (for useParams).
 * - `auth`: an AuthContext value, for components that read it (omit to render without one).
 * - `history`: paths visited before `route` (in order), so the page can navigate back.
 * Returns RTL's result plus a `user` (user-event) and `location()` (the current path).
 */
export function renderWithProviders(
  ui,
  { route = "/", path = "*", auth, history = [] } = {}
) {
  const tree = (
    <MemoryRouter
      initialEntries={[...history, route]}
      initialIndex={history.length}
    >
      <Routes>
        <Route path={path} element={ui} />
        <Route path="*" element={null} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  );
  const result = render(
    <MantineProvider>
      <ModalsProvider>
        <DatesProvider settings={{ timezone: "UTC" }}>
          {auth ? (
            <AuthContext.Provider value={auth}>{tree}</AuthContext.Provider>
          ) : (
            tree
          )}
        </DatesProvider>
      </ModalsProvider>
    </MantineProvider>
  );
  return {
    ...result,
    user: userEvent.setup(),
    location: () => result.getByTestId("location").textContent,
  };
}

/** A resolved axios-like response. */
export const ok = (data) => Promise.resolve({ data });

/** A Spring page response with `content`. */
export const page = (content, extra = {}) =>
  ok({ content, totalPages: 1, totalElements: content.length, ...extra });

/**
 * Picks `option` in the Mantine Select labelled `name` (clicks the box, then the option).
 * @param {{ click: (element: Element) => Promise<void> }} user from userEvent.setup()
 * @param {string} name
 * @param {string} option
 */
export async function pickOption(user, name, option) {
  await user.click(screen.getByRole("textbox", { name }));
  await user.click(await screen.findByRole("option", { name: option }));
}
