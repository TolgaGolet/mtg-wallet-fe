import axios from "axios";
import jwt_decode from "jwt-decode";
import dayjs from "dayjs";
import { useContext, useEffect, useRef } from "react";
import AuthContext from "../context/AuthContext";
import showNotification from "../components/showNotification";
import { userTimezoneOffsetInHours } from "..";

const baseURL = process.env.REACT_APP_API_BASE_URL;

const useAxios = () => {
  const { authTokens, setUser, setAuthTokens, logoutUser } =
    useContext(AuthContext);
  const failedQueueRef = useRef([]);
  const currentRefreshPromiseRef = useRef(null);
  const axiosInstanceRef = useRef(null);

  const processFailedQueue = (error, token = null) => {
    if (!failedQueueRef.current) {
      return;
    }

    failedQueueRef.current.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    failedQueueRef.current = [];
  };

  const isTokenExpired = (token) => {
    try {
      const user = jwt_decode(token);
      return dayjs.unix(user.exp).diff(dayjs()) < 1;
    } catch (error) {
      return true;
    }
  };

  const refreshAuthToken = async () => {
    try {
      // Check if refresh token is expired
      if (isTokenExpired(authTokens?.refreshToken)) {
        logoutUser();
        throw new Error("Refresh token expired");
      }

      if (!currentRefreshPromiseRef.current) {
        currentRefreshPromiseRef.current = axios
          .post(
            `${baseURL}${process.env.REACT_APP_REFRESH_TOKEN_URL}`,
            {},
            {
              headers: {
                Authorization: `Bearer ${authTokens?.refreshToken}`,
              },
            }
          )
          .then((response) => {
            const newTokens = response?.data;
            if (!newTokens) {
              throw new Error("Failed to refresh token");
            }

            localStorage.setItem(
              process.env.REACT_APP_AUTH_TOKENS_LOCAL_STORAGE_KEY,
              JSON.stringify(newTokens)
            );
            setAuthTokens(newTokens);
            setUser(jwt_decode(newTokens?.accessToken));
            processFailedQueue(null, newTokens.accessToken);
            return newTokens;
          })
          .catch((error) => {
            if (
              error?.response?.status === 401 ||
              error?.response?.status === 403
            ) {
              logoutUser();
            }
            processFailedQueue(error, null);
            throw error;
          });
      }
      return await currentRefreshPromiseRef.current;
    } finally {
      if (!currentRefreshPromiseRef.current?.then) {
        currentRefreshPromiseRef.current = null;
      }
    }
  };

  // Initialize axios instance only once
  if (!axiosInstanceRef.current) {
    axiosInstanceRef.current = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${authTokens?.accessToken}`,
      },
    });

    axiosInstanceRef.current.interceptors.request.use(
      async (config) => {
        if (!config.headers) {
          config.headers = {};
        }

        // Mantine Dates gets Dates as GMT +userTimezoneOffsetInHours and Axios converts Dates to UTC.
        // Backend uses LocalDateTime in UTC but we want to store user's relative timezone.
        // So we need to add userTimezone hours to the Date to get it in  user's relative timezone.
        if (config.data) {
          Object.keys(config.data).forEach((key) => {
            if (config.data[key] instanceof Date) {
              config.data[key] = new Date(
                config.data[key].getTime() +
                  userTimezoneOffsetInHours * 60 * 60 * 1000
              ).toISOString();
            }
          });
        }

        const currentTokens = JSON.parse(
          localStorage.getItem(
            process.env.REACT_APP_AUTH_TOKENS_LOCAL_STORAGE_KEY
          )
        );

        if (!currentTokens?.accessToken) {
          return config;
        }

        if (!isTokenExpired(currentTokens.accessToken)) {
          config.headers.Authorization = `Bearer ${currentTokens.accessToken}`;
          return config;
        }

        try {
          const newTokens = await refreshAuthToken();
          config.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return config;
        } catch (error) {
          return Promise.reject(error);
        }
      },
      (error) => Promise.reject(error)
    );

    axiosInstanceRef.current.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          error?.response?.status === 401 ||
          error?.response?.status === 403
        ) {
          if (originalRequest.url === process.env.REACT_APP_REFRESH_TOKEN_URL) {
            currentRefreshPromiseRef.current = null;
            processFailedQueue(error, null);
            logoutUser();
            return Promise.reject(error);
          }

          if (!originalRequest._retry) {
            originalRequest._retry = true;
            try {
              const newTokens = await refreshAuthToken();
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              return axiosInstanceRef.current(originalRequest);
            } catch (refreshError) {
              return Promise.reject(refreshError);
            }
          }
        }

        if (error?.response?.data) {
          showNotification(error.response.data, "error");
        }

        if (error?.response?.status === 429) {
          showNotification(
            "Too many requests. Try again after a few minutes",
            "error"
          );
        }

        return Promise.reject(error);
      }
    );
  }

  // Update headers when tokens change
  useEffect(() => {
    if (authTokens?.accessToken && axiosInstanceRef.current) {
      axiosInstanceRef.current.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${authTokens.accessToken}`;
    }
  }, [authTokens]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      failedQueueRef.current = [];
      currentRefreshPromiseRef.current = null;
    };
  }, []);

  return axiosInstanceRef.current;
};

export default useAxios;
