import { createContext, useState, useEffect, useMemo } from "react";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";
import showNotification from "../components/showNotification";

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

  const loginUser = async (e, setIsLoading, setIsUsernameOrPasswordWrong) => {
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
    } else if (response?.status === 401) {
      showNotification("Username or password is wrong!", "error");
      setIsUsernameOrPasswordWrong(true);
    } else {
      showNotification("Something went wrong!", "error");
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
    navigate("/login", { replace: true });
  };

  const signUpUser = async (e, setIsLoading, setIsUsernameAlreadyTaken) => {
    let response = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}${process.env.REACT_APP_SIGN_UP_URL}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: e?.username,
          name: e?.name,
          surname: e?.surname,
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
    } else if (response?.status === 409) {
      showNotification(
        "Username is already taken. Please choose another username",
        "error"
      );
      setIsUsernameAlreadyTaken(true);
    } else {
      showNotification("Something went wrong!", "error");
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
