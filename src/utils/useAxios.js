import axios from "axios";
import jwt_decode from "jwt-decode";
import dayjs from "dayjs";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";

const baseURL = process.env.REACT_APP_API_BASE_URL;

const useAxios = () => {
  const { authTokens, setUser, setAuthTokens, logoutUser } =
    useContext(AuthContext);

  const axiosInstance = getAxiosInstance(authTokens);
  addRequestInterceptor(
    axiosInstance,
    authTokens,
    setUser,
    setAuthTokens,
    logoutUser
  );
  addResponseInterceptor(axiosInstance, logoutUser);
  return axiosInstance;
};

const getAxiosInstance = (authTokens) => {
  return axios.create({
    baseURL,
    headers: {
      Authorization: `Bearer ${authTokens?.accessToken}`,
    },
  });
};

const addRequestInterceptor = (
  axiosInstance,
  authTokens,
  setUser,
  setAuthTokens,
  logoutUser
) => {
  axiosInstance.interceptors.request.use((request) => {
    const user = jwt_decode(authTokens?.accessToken);
    const isExpired = dayjs.unix(user?.exp).diff(dayjs()) < 1;

    if (!isExpired) {
      return request;
    }

    if (!request.headers) {
      request.headers = {};
    }

    // Create a promise to handle the asynchronous refresh token logic
    return new Promise((resolve, reject) => {
      axios
        .post(
          `${baseURL}${process.env.REACT_APP_REFRESH_TOKEN_URL}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${authTokens?.refreshToken}`,
            },
          }
        )
        .then((refreshTokenResponse) => {
          localStorage.setItem(
            process.env.REACT_APP_AUTH_TOKENS_LOCAL_STORAGE_KEY,
            JSON.stringify(refreshTokenResponse?.data)
          );
          setAuthTokens(refreshTokenResponse?.data);
          setUser(jwt_decode(refreshTokenResponse?.data?.accessToken));
          request.headers.Authorization = `Bearer ${refreshTokenResponse?.data?.accessToken}`;
          resolve(request);
        })
        .catch((error) => {
          console.error("An error occurred on refresh token attempt", error);
          if (
            error?.response?.status === 403 ||
            error?.response?.status === 401
          ) {
            console.error("403 or 401 response received");
            logoutUser();
          }
          reject(error);
        });
    });
  });
};

const addResponseInterceptor = (axiosInstance, logoutUser) => {
  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error?.response?.status === 403 || error?.response?.status === 401) {
        console.error("403 or 401 response received");
        logoutUser();
      }
      return Promise.reject(error);
    }
  );
};

export default useAxios;
