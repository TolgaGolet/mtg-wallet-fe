import { createContext, useState, useEffect, useMemo } from "react";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";

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

  const loginUser = async (e) => {
    e.preventDefault();
    let response = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}${process.env.REACT_APP_LOGIN_URL}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: e?.target?.username?.value,
          password: e?.target?.password?.value,
        }),
      }
    );
    let data = await response?.json();
    if (response?.status === 200) {
      setAuthTokens(data);
      setUser(jwt_decode(data?.accessToken));
      localStorage.setItem(authTokensLocalStorageKey, JSON.stringify(data));
      navigate("/", { replace: true });
    } else {
      alert("Something went wrong!");
    }
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

  const contextData = useMemo(
    () => ({
      user: user,
      authTokens: authTokens,
      setAuthTokens: setAuthTokens,
      setUser: setUser,
      loginUser: loginUser,
      logoutUser: logoutUser,
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
