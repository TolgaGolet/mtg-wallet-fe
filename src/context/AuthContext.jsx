import { createContext, useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import showNotification from "../components/showNotification";
import { useMantineColorScheme } from "@mantine/core";
import {
  configureAuth,
  decodeUser,
  getErrorMessage,
  isTokenExpired,
  notifySessionChange,
  publicApi,
  readTokens,
} from "../api/client";
import { getErrorCode, NOT_VERIFIED_EMAIL } from "../api/errorCodes";

const AuthContext = createContext();
const authTokensLocalStorageKey = import.meta.env
  .VITE_AUTH_TOKENS_LOCAL_STORAGE_KEY;

/**
 * Holds the session: the tokens (also in localStorage) and the decoded `user`.
 * The functions return results instead of touching page state, so each page owns its own UI.
 */
export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(readTokens);
  // Derived, so it can never disagree with the tokens
  const user = useMemo(() => decodeUser(authTokens), [authTokens]);
  const navigate = useNavigate();
  const { clearColorScheme } = useMantineColorScheme();

  const storeTokens = (tokens) => {
    localStorage.setItem(authTokensLocalStorageKey, JSON.stringify(tokens));
    setAuthTokens(tokens);
  };

  /**
   * Signs in with `{ username, password }`, or `{ verificationCode }` (plus both) for the TOTP step.
   * Resolves to `{ status: "ok" }`, `{ status: "totp" }` (a code is needed next), or
   * `{ status: "error", message, isEmailVerificationRequired }`. Error toasts come from the client.
   */
  const loginUser = async ({ username, password, verificationCode }) => {
    const url = verificationCode
      ? "auth/totp/verify"
      : import.meta.env.VITE_LOGIN_URL;
    try {
      const { data } = await publicApi.post(url, {
        username,
        password,
        verificationCode,
      });
      if (data?.totpRequired) {
        return { status: "totp" };
      }
      // The backend creates the default categories and payees when the email is verified
      storeTokens(data);
      return { status: "ok" };
    } catch (error) {
      return {
        status: "error",
        message: getErrorMessage(error, ""),
        isEmailVerificationRequired:
          getErrorCode(error.response) === NOT_VERIFIED_EMAIL,
      };
    }
  };

  const logoutUser = (message = "You have been successfully logged out!") => {
    const tokens = readTokens();
    // The backend revokes all of the user's sessions from any token it still stores. An expired
    // access token's row may already be gone (old rows are pruned), so send the refresh token then.
    const token =
      tokens?.accessToken && !isTokenExpired(tokens.accessToken)
        ? tokens.accessToken
        : tokens?.refreshToken;
    if (token) {
      // Best effort: the tokens may already be revoked (e.g. after account deletion)
      publicApi
        .post(
          import.meta.env.VITE_LOGOUT_URL,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
            silentErrors: true,
          }
        )
        .catch(() => {});
    }
    localStorage.removeItem(authTokensLocalStorageKey);
    setAuthTokens(null);
    clearColorScheme();
    navigate("/login", { replace: true });
    showNotification(message, "success");
  };

  /** Registers a user. Rejects with the axios error on failure (the client has shown the toast). */
  const signUpUser = ({ username, email, name, surname, password }) =>
    publicApi.post(import.meta.env.VITE_SIGN_UP_URL, {
      username,
      email,
      name,
      surname,
      password,
    });

  // The API client refreshes tokens outside React; keep it pointed at the latest logout
  const logoutUserRef = useRef(logoutUser);
  logoutUserRef.current = logoutUser;
  useEffect(() => {
    configureAuth({
      onTokensRefreshed: setAuthTokens,
      onAuthFailure: () => logoutUserRef.current(),
    });
  }, []);

  // localStorage is shared by all tabs: follow logins, logouts and refreshes made in another tab,
  // so this tab never keeps showing (or sending requests as) a session that has changed. A logout
  // only clears the user: PrivateRoute moves protected pages to /login, and public pages (reset
  // password, verify email) stay where they are.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== null && event.key !== authTokensLocalStorageKey) {
        return;
      }
      setAuthTokens(readTokens());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Module-level state tied to one session (see onSessionChange) is cleared on logout or a user switch
  const sessionUser = user?.sub;
  const previousSessionUser = useRef(sessionUser);
  useEffect(() => {
    if (previousSessionUser.current !== sessionUser) {
      previousSessionUser.current = sessionUser;
      notifySessionChange();
    }
  }, [sessionUser]);

  // Not memoized: the provider only re-renders when its own auth state changes
  const contextData = {
    user,
    authTokens,
    loginUser,
    logoutUser,
    signUpUser,
    // For endpoints that rotate the session (e.g. enabling 2FA revokes the old tokens)
    adoptTokens: storeTokens,
  };

  return (
    <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>
  );
};

export default AuthContext;
