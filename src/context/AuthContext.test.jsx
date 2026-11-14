import { useContext } from "react";
import { act, screen, waitFor } from "@testing-library/react";
import AuthContext, { AuthProvider } from "./AuthContext";
import { publicApi } from "../api/client";
import { renderWithProviders } from "../test/renderWithProviders";
import { fakeJwt } from "../test/jwt";
import PrivateRoute from "../utils/PrivateRoute";

const KEY = import.meta.env.VITE_AUTH_TOKENS_LOCAL_STORAGE_KEY;

function Probe() {
  const { user, loginUser, logoutUser } = useContext(AuthContext);
  return (
    <div>
      <span data-testid="user">{user?.sub ?? "nobody"}</span>
      <button
        onClick={() => loginUser({ username: "ada", password: "pw" })}
        type="button"
      >
        login
      </button>
      <button onClick={() => logoutUser()} type="button">
        logout
      </button>
    </div>
  );
}

const store = (tokens) => localStorage.setItem(KEY, JSON.stringify(tokens));

/** What the browser does in this tab when another tab changes localStorage. */
function changeInOtherTab(tokens) {
  if (tokens) {
    store(tokens);
  } else {
    localStorage.removeItem(KEY);
  }
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  });
}

const renderAuth = () =>
  renderWithProviders(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
    { route: "/" }
  );

describe("session sync across tabs (F4)", () => {
  test("a logout in another tab sends a protected page to the login page", async () => {
    store({ accessToken: fakeJwt("ada"), refreshToken: fakeJwt("r") });
    const { location } = renderWithProviders(
      <AuthProvider>
        <PrivateRoute>
          <Probe />
        </PrivateRoute>
      </AuthProvider>,
      { route: "/", path: "/" }
    );
    expect(screen.getByTestId("user")).toHaveTextContent("ada");

    changeInOtherTab(null);

    await waitFor(() => expect(location()).toBe("/login"));
  });

  // Regression: the listener itself navigated to /login, so a reset-password or verify-email page
  // open in this tab was taken away when the reset logged out the other tab
  test("a logout in another tab leaves a public page where it is", () => {
    store({ accessToken: fakeJwt("ada"), refreshToken: fakeJwt("r") });
    const { location } = renderWithProviders(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
      { route: "/reset-password/tok" }
    );

    changeInOtherTab(null);

    expect(screen.getByTestId("user")).toHaveTextContent("nobody");
    expect(location()).toBe("/reset-password/tok");
  });

  test("a login as someone else in another tab switches this tab's user", () => {
    store({ accessToken: fakeJwt("ada"), refreshToken: fakeJwt("r") });
    renderAuth();

    changeInOtherTab({
      accessToken: fakeJwt("bob"),
      refreshToken: fakeJwt("r2"),
    });

    expect(screen.getByTestId("user")).toHaveTextContent("bob");
  });
});

// F14: the backend creates the defaults when the email is verified
test("a login stores the tokens and makes no other request", async () => {
  const post = vi.spyOn(publicApi, "post").mockResolvedValue({
    data: { accessToken: fakeJwt("ada"), refreshToken: fakeJwt("r") },
  });
  const { user } = renderAuth();
  await user.click(screen.getByRole("button", { name: "login" }));
  await waitFor(() =>
    expect(screen.getByTestId("user")).toHaveTextContent("ada")
  );
  expect(post).toHaveBeenCalledTimes(1);
  expect(post).toHaveBeenCalledWith("auth/authenticate", {
    username: "ada",
    password: "pw",
    verificationCode: undefined,
  });
});

// The backend can only revoke the session from a token it still stores, and rows of old
// (expired) access tokens get pruned
test("logout sends the refresh token when the access token has expired", async () => {
  const refreshToken = fakeJwt("r");
  store({ accessToken: fakeJwt("ada", -60), refreshToken });
  const post = vi.spyOn(publicApi, "post").mockResolvedValue({ data: {} });
  const { user, location } = renderAuth();

  await user.click(screen.getByRole("button", { name: "logout" }));

  expect(post).toHaveBeenCalledWith(
    "auth/logout",
    {},
    expect.objectContaining({
      headers: { Authorization: `Bearer ${refreshToken}` },
    })
  );
  expect(localStorage.getItem(KEY)).toBeNull();
  await waitFor(() => expect(location()).toBe("/login"));
});
