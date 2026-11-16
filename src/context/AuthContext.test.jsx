import { useContext } from "react";
import { act, screen, waitFor } from "@testing-library/react";
import AuthContext, { AuthProvider } from "./AuthContext";
import { onSessionChange, publicApi } from "../api/client";
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

// Module-level state that belongs to one session (e.g. a Home currency still being saved) is cleared
test("session-change listeners run on a user switch and on logout, not on a token refresh", async () => {
  store({ accessToken: fakeJwt("ada"), refreshToken: fakeJwt("r") });
  vi.spyOn(publicApi, "post").mockResolvedValue({ data: {} });
  const listener = vi.fn();
  const unsubscribe = onSessionChange(listener);
  try {
    const { user } = renderAuth();
    expect(listener).not.toHaveBeenCalled();

    changeInOtherTab({
      accessToken: fakeJwt("ada", 7200),
      refreshToken: fakeJwt("r2"),
    });
    expect(listener).not.toHaveBeenCalled();

    changeInOtherTab({
      accessToken: fakeJwt("bob"),
      refreshToken: fakeJwt("r3"),
    });
    expect(listener).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "logout" }));
    await waitFor(() => expect(listener).toHaveBeenCalledTimes(2));
  } finally {
    unsubscribe();
  }
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

describe("loginUser results", () => {
  /** Renders the provider and hands back its context value (always the latest render's). */
  function renderContext() {
    const latest = {};
    function Capture() {
      latest.auth = useContext(AuthContext);
      return (
        <span data-testid="user">{latest.auth.user?.sub ?? "nobody"}</span>
      );
    }
    renderWithProviders(
      <AuthProvider>
        <Capture />
      </AuthProvider>,
      { route: "/" }
    );
    return latest;
  }

  const login = async (latest, credentials) => {
    let result;
    await act(async () => {
      result = await latest.auth.loginUser(credentials);
    });
    return result;
  };

  const TOKENS = { accessToken: fakeJwt("ada"), refreshToken: fakeJwt("r") };

  test("an account with 2FA asks for the code and stores nothing yet", async () => {
    vi.spyOn(publicApi, "post").mockResolvedValue({
      data: { totpRequired: true },
    });
    const latest = renderContext();

    const result = await login(latest, { username: "ada", password: "pw" });

    expect(result).toEqual({ status: "totp" });
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(screen.getByTestId("user")).toHaveTextContent("nobody");
  });

  test("the 2FA step sends the code with the credentials to the TOTP endpoint and signs in", async () => {
    const post = vi
      .spyOn(publicApi, "post")
      .mockResolvedValue({ data: TOKENS });
    const latest = renderContext();

    const result = await login(latest, {
      username: "ada",
      password: "pw",
      verificationCode: "123456",
    });

    expect(result).toEqual({ status: "ok" });
    expect(post).toHaveBeenCalledWith("auth/totp/verify", {
      username: "ada",
      password: "pw",
      verificationCode: "123456",
    });
    expect(JSON.parse(localStorage.getItem(KEY))).toEqual(TOKENS);
    expect(screen.getByTestId("user")).toHaveTextContent("ada");
  });

  // The verification prompt follows the error code, not the message text
  test.each([
    [
      "an unverified email asks for verification",
      "NOT_VERIFIED_EMAIL",
      "An error occurred: Please verify your email.",
      true,
    ],
    [
      "a wrong password is an error without the verification prompt",
      "BAD_CREDENTIALS",
      "An error occurred: Bad credentials.",
      false,
    ],
  ])("%s", async (_name, code, message, isEmailVerificationRequired) => {
    vi.spyOn(publicApi, "post").mockRejectedValue({
      response: {
        status: 400,
        data: message,
        headers: { "x-error-code": code },
      },
    });
    const latest = renderContext();

    const result = await login(latest, { username: "ada", password: "pw" });

    expect(result).toEqual({
      status: "error",
      message,
      isEmailVerificationRequired,
    });
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  test("a network error resolves to an error with an empty message instead of throwing", async () => {
    vi.spyOn(publicApi, "post").mockRejectedValue(new Error("Network Error"));
    const latest = renderContext();

    const result = await login(latest, { username: "ada", password: "pw" });

    expect(result).toEqual({
      status: "error",
      message: "",
      isEmailVerificationRequired: false,
    });
  });

  // The sign-up form also holds confirmPassword, which RegisterRequest doesn't have
  test("sign-up sends only the fields the backend's register request accepts", async () => {
    const post = vi.spyOn(publicApi, "post").mockResolvedValue({ data: {} });
    const latest = renderContext();

    await act(() =>
      latest.auth.signUpUser({
        username: "ada",
        email: "ada@example.com",
        name: "Ada",
        surname: "",
        password: "Str0ng!Pass",
        confirmPassword: "Str0ng!Pass",
      })
    );

    expect(post).toHaveBeenCalledWith("auth/register", {
      username: "ada",
      email: "ada@example.com",
      name: "Ada",
      surname: "",
      password: "Str0ng!Pass",
    });
  });
});
