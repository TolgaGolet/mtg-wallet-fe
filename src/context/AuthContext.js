import { createContext, useState, useEffect, useMemo, useRef } from "react";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";
import showNotification from "../components/showNotification";
import { useMantineColorScheme } from "@mantine/core";
import {
  api,
  configureAuth,
  getErrorMessage,
  publicApi,
  readTokens,
} from "../api/client";
import { getErrorCode, NOT_VERIFIED_EMAIL } from "../api/errorCodes";

const AuthContext = createContext();
const authTokensLocalStorageKey =
  process.env.REACT_APP_AUTH_TOKENS_LOCAL_STORAGE_KEY;

const decodeUser = (tokens) => {
  try {
    return tokens?.accessToken ? jwt_decode(tokens.accessToken) : null;
  } catch {
    return null;
  }
};

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
      : process.env.REACT_APP_LOGIN_URL;
    try {
      const { data } = await publicApi.post(url, {
        username,
        password,
        verificationCode,
      });
      if (data?.totpRequired) {
        return { status: "totp" };
      }
      storeTokens(data);
      // Best effort: creates the default payees for a first login
      api.post("payee/create-defaults").catch(() => {});
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
    const accessToken = readTokens()?.accessToken;
    // Best effort: the tokens may already be revoked (e.g. after account deletion)
    publicApi
      .post(
        process.env.REACT_APP_LOGOUT_URL,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          silentErrors: true,
        }
      )
      .catch(() => {});
    localStorage.removeItem(authTokensLocalStorageKey);
    setAuthTokens(null);
    clearColorScheme();
    navigate("/login", { replace: true });
    showNotification(message, "success");
  };

  /** Registers a user. Rejects with the axios error on failure (the client has shown the toast). */
  const signUpUser = ({ username, email, name, surname, password }) =>
    publicApi.post(process.env.REACT_APP_SIGN_UP_URL, {
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

  // Not memoized: the provider only re-renders when its own auth state changes
  const contextData = {
    user,
    authTokens,
    loginUser,
    logoutUser,
    signUpUser,
  };

  return (
    <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>
  );
};

export default AuthContext;
