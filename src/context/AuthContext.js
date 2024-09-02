import { createContext, useState, useEffect, useMemo } from "react";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";
import showNotification from "../components/showNotification";
import { useMantineColorScheme } from "@mantine/core";

const AuthContext = createContext();
const authTokensLocalStorageKey =
  process.env.REACT_APP_AUTH_TOKENS_LOCAL_STORAGE_KEY;

export const AuthProvider = ({ children }) => {
  let [authTokens, setAuthTokens] = useState(() =>
    localStorage.getItem(authTokensLocalStorageKey)
      ? JSON.parse(localStorage.getItem(authTokensLocalStorageKey))
      : null
  );
  let [user, setUser] = useState(() =>
    localStorage.getItem(authTokensLocalStorageKey)
      ? jwt_decode(localStorage.getItem(authTokensLocalStorageKey))
      : null
  );
  let [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { clearColorScheme } = useMantineColorScheme();

  const loginUser = async (e, setIsLoading, setErrorData) => {
    let response = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}${process.env.REACT_APP_LOGIN_URL}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: e?.username,
          password: e?.password,
        }),
      }
    );
    if (response?.status === 200) {
      let data = await response?.json();
      setAuthTokens(data);
      setUser(jwt_decode(data?.accessToken));
      localStorage.setItem(authTokensLocalStorageKey, JSON.stringify(data));
      navigate("/", { replace: true });
      showNotification("You have been successfully signed in", "success");
    } else if (response?.status === 401) {
      let message = await response.text();
      showNotification(message, "error");
      setErrorData({ isErrorState: true, message: message });
    } else if (response?.status === 429) {
      showNotification(
        "Too many requests. Try again after a few minutes",
        "error"
      );
    } else {
      let message = await response.text();
      showNotification("Something went wrong! " + message, "error");
    }
    setIsLoading(false);
  };

  const logoutUser = () => {
    fetch(
      `${process.env.REACT_APP_API_BASE_URL}${process.env.REACT_APP_LOGOUT_URL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authTokens?.accessToken}`,
        },
      }
    );
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem(authTokensLocalStorageKey);
    clearColorScheme();
    navigate("/login", { replace: true });
    showNotification("You have been successfully logged out!", "success");
  };

  const createDefaults = (accessToken) => {
    fetch(`${process.env.REACT_APP_API_BASE_URL}payee/create-defaults`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  };

  const signUpUser = async (e, setIsLoading, setErrorData) => {
    let response = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}${process.env.REACT_APP_SIGN_UP_URL}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: e?.username,
          email: e?.email,
          name: e?.name,
          surname: e?.surname,
          password: e?.password,
        }),
      }
    );
    if (response?.status === 200) {
      let data = await response?.json();
      let accessToken = data?.accessToken;
      setAuthTokens(data);
      setUser(jwt_decode(accessToken));
      localStorage.setItem(authTokensLocalStorageKey, JSON.stringify(data));
      navigate("/", { replace: true });
      createDefaults(accessToken);
      showNotification("You have been successfully signed up", "success");
    } else if (response?.status === 409) {
      let message = await response.text();
      showNotification(message, "error");
      setErrorData({ isErrorState: true, message: message });
    } else if (response?.status === 429) {
      showNotification(
        "Too many requests. Try again after a few minutes",
        "error"
      );
    } else {
      let message = await response.text();
      showNotification("Something went wrong! " + message, "error");
    }
    setIsLoading(false);
  };

  const contextData = useMemo(
    () => ({
      user: user,
      authTokens: authTokens,
      setAuthTokens: setAuthTokens,
      setUser: setUser,
      loginUser: loginUser,
      logoutUser: logoutUser,
      signUpUser: signUpUser,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, authTokens]
  );

  useEffect(() => {
    if (authTokens) {
      setUser(jwt_decode(authTokens.accessToken));
    }
    setIsLoading(false);
  }, [authTokens, isLoading]);

  return (
    <AuthContext.Provider value={contextData}>
      {isLoading ? null : children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
