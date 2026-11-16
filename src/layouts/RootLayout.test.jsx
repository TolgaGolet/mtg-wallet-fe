import { act, screen, waitFor, within } from "@testing-library/react";
import RootLayout from "./RootLayout";
import { renderWithProviders } from "../test/renderWithProviders";

/** A window.matchMedia whose min-width queries can be switched to "desktop" from the test. */
function stubMatchMedia() {
  const widthListeners = new Set();
  const spy = vi.spyOn(window, "matchMedia").mockImplementation((query) => {
    const isWidth = query.includes("min-width");
    return {
      matches: false,
      media: query,
      onchange: null,
      addEventListener: (_type, listener) => {
        if (isWidth) widthListeners.add(listener);
      },
      removeEventListener: (_type, listener) => widthListeners.delete(listener),
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    };
  });
  return {
    spy,
    widenToDesktop: () =>
      act(() =>
        widthListeners.forEach((listener) => listener({ matches: true }))
      ),
  };
}

let media;
beforeEach(() => {
  media = stubMatchMedia();
});
afterEach(() => {
  media.spy.mockRestore();
});

const renderLayout = ({ user = { sub: "ada" }, route = "/" } = {}) => {
  const logoutUser = vi.fn();
  const view = renderWithProviders(<RootLayout />, {
    route,
    auth: { user, logoutUser },
  });
  return { ...view, logoutUser };
};

/** Navs labelled "Main": the desktop menu, plus the mobile one while it is open. */
const mainNavs = () => screen.queryAllByRole("navigation", { name: "Main" });
const desktopNav = () => mainNavs()[0];
// The burger is hidden from sm up; jsdom then gives it no accessible name, so find it by aria-label
const burger = () => screen.getByLabelText("Toggle navigation");
const openMobileMenu = (user) => user.click(burger());

test("a logged-out visitor only sees the public menu items and no logout", () => {
  renderLayout({ user: null });

  const links = within(desktopNav())
    .getAllByRole("link")
    .map((link) => link.textContent);
  expect(links).toEqual(["Home", "Help & Contact"]);
  expect(screen.queryByRole("button", { name: "Logout" })).toBeNull();
});

test("a logged-in user sees every menu item, in order", () => {
  renderLayout();

  const links = within(desktopNav())
    .getAllByRole("link")
    .map((link) => link.textContent);
  expect(links).toEqual([
    "Home",
    "Transactions",
    "Accounts",
    "Payees",
    "Categories",
    "Settings",
    "Help & Contact",
  ]);
});

test("only the current page's item is marked current (Home matches only '/')", () => {
  renderLayout({ route: "/transactions" });

  const nav = within(desktopNav());
  expect(nav.getByRole("link", { name: "Transactions" })).toHaveAttribute(
    "aria-current",
    "page"
  );
  expect(nav.getByRole("link", { name: "Home" })).not.toHaveAttribute(
    "aria-current"
  );
});

test("a nested path keeps its section current", () => {
  renderLayout({ route: "/accounts/3" });

  expect(
    within(desktopNav()).getByRole("link", { name: "Accounts" })
  ).toHaveAttribute("aria-current", "page");
});

test("the logout button logs out", async () => {
  const { user, logoutUser } = renderLayout();

  await user.click(screen.getByRole("button", { name: "Logout" }));

  expect(logoutUser).toHaveBeenCalledTimes(1);
});

describe("mobile menu", () => {
  test("is not mounted until the burger opens it", async () => {
    const { user } = renderLayout();
    expect(mainNavs()).toHaveLength(1);
    expect(burger()).toHaveAttribute("aria-expanded", "false");

    await openMobileMenu(user);

    expect(mainNavs()).toHaveLength(2);
    expect(burger()).toHaveAttribute("aria-expanded", "true");
  });

  test("following a link navigates and closes the menu", async () => {
    const { user, location } = renderLayout();
    await openMobileMenu(user);

    await user.click(
      within(mainNavs()[1]).getByRole("link", { name: "Payees" })
    );

    expect(location()).toBe("/payees");
    await waitFor(() => expect(mainNavs()).toHaveLength(1));
  });

  test("its logout button logs out and closes the menu", async () => {
    const { user, logoutUser } = renderLayout();
    await openMobileMenu(user);

    await user.click(
      within(mainNavs()[1]).getByRole("button", { name: "Logout" })
    );

    expect(logoutUser).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mainNavs()).toHaveLength(1));
  });

  test("closes when the window widens to the desktop layout", async () => {
    const { user } = renderLayout();
    await openMobileMenu(user);
    expect(mainNavs()).toHaveLength(2);

    media.widenToDesktop();

    await waitFor(() => expect(mainNavs()).toHaveLength(1));
  });
});
