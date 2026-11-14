import axios from "axios";
import jwt_decode from "jwt-decode";
import showNotification from "../components/showNotification";
import { toLocalDateTime } from "../utils/dates";

// Render's free tier can take close to a minute to wake up, so the timeout leaves room for a cold start.
export const REQUEST_TIMEOUT_MS = 60000;
export const NETWORK_ERROR_MESSAGE =
  "Network error. Check your connection and try again.";
export const TOO_MANY_REQUESTS_MESSAGE =
  "Too many requests. Try again after a few minutes";

const tokensKey = () => process.env.REACT_APP_AUTH_TOKENS_LOCAL_STORAGE_KEY;

/** The one client every authenticated call goes through (see useAxios). */
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

/** Interceptor-free client for the refresh call, so a failed refresh can't trigger another refresh. */
export const refreshClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

let handlers = { onTokensRefreshed: () => {}, onAuthFailure: () => {} };

/** Called once by AuthProvider so the client can update React state and log out. */
export function configureAuth(newHandlers) {
  handlers = { ...handlers, ...newHandlers };
}

export function readTokens() {
  try {
    return JSON.parse(localStorage.getItem(tokensKey())) ?? null;
  } catch {
    localStorage.removeItem(tokensKey());
    return null;
  }
}

export function isTokenExpired(token) {
  try {
    return jwt_decode(token).exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

// Statuses with which the refresh endpoint says the session is gone (JWT_* / missing header are 401).
// Anything else (429 rate limit, 5xx while Render wakes up or deploys) is transient: stay logged in.
const SESSION_GONE_STATUSES = [401, 403];

function authFailure(error) {
  error.isAuthFailure = true;
  // Log out once: requests whose 401 arrives after the logout cleared the tokens just fail quietly
  if (readTokens()) {
    handlers.onAuthFailure();
  }
  return error;
}

async function doRefresh() {
  const refreshToken = readTokens()?.refreshToken;
  if (isTokenExpired(refreshToken)) {
    throw authFailure(new Error("Refresh token expired"));
  }
  let response;
  try {
    response = await refreshClient.post(
      process.env.REACT_APP_REFRESH_TOKEN_URL,
      {},
      { headers: { Authorization: `Bearer ${refreshToken}` } }
    );
  } catch (error) {
    // Network errors, timeouts, 429 and 5xx say nothing about the session, so stay logged in
    throw SESSION_GONE_STATUSES.includes(error.response?.status)
      ? authFailure(error)
      : error;
  }
  const newTokens = response?.data;
  if (!newTokens?.accessToken) {
    throw authFailure(new Error("Failed to refresh token"));
  }
  localStorage.setItem(tokensKey(), JSON.stringify(newTokens));
  handlers.onTokensRefreshed(newTokens);
  return newTokens;
}

let refreshing = null;

/** All callers share one in-flight refresh. It is cleared when it settles, so the next expiry refreshes again. */
export function refreshTokens() {
  refreshing ??= doRefresh().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

// The backend stores LocalDateTime in the user's local time, so top-level Date fields are sent as
// local wall-clock strings (no zone). Works on a copy so the caller's object isn't changed.
function serializeDates(data) {
  if (!isPlainObject(data)) {
    return data;
  }
  const serialized = { ...data };
  Object.keys(serialized).forEach((key) => {
    if (serialized[key] instanceof Date) {
      serialized[key] = toLocalDateTime(serialized[key]);
    }
  });
  return serialized;
}

api.interceptors.request.use(async (config) => {
  config.data = serializeDates(config.data);
  const tokens = readTokens();
  if (!tokens?.accessToken) {
    return config;
  }
  const accessToken = isTokenExpired(tokens.accessToken)
    ? (await refreshTokens()).accessToken
    : tokens.accessToken;
  config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

/** The server's error text (a plain-string body), or `fallback` when there is none. */
export function getErrorMessage(error, fallback = "Something went wrong") {
  const data = error?.response?.data;
  return typeof data === "string" && data ? data : fallback;
}

// Pass `{ silentErrors: true }` in a request's config when the page shows the error itself
function notifyError(error) {
  if (
    error?.isAuthFailure ||
    axios.isCancel(error) ||
    error?.config?.silentErrors
  ) {
    return;
  }
  if (!error?.response) {
    showNotification(NETWORK_ERROR_MESSAGE, "error");
  } else if (error.response.status === 429) {
    showNotification(TOO_MANY_REQUESTS_MESSAGE, "error");
  } else if (typeof error.response.data === "string" && error.response.data) {
    showNotification(error.response.data, "error");
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error?.config;
    const status = error?.response?.status;
    // A failed refresh from the request interceptor also lands here (with the refresh call's
    // config), so isAuthFailure keeps it from triggering another refresh
    const canRetry = original && !original._retry && !error.isAuthFailure;
    if ((status === 401 || status === 403) && canRetry) {
      original._retry = true;
      let tokens;
      try {
        tokens = await refreshTokens();
      } catch (refreshError) {
        notifyError(refreshError);
        throw refreshError;
      }
      original.headers.Authorization = `Bearer ${tokens.accessToken}`;
      // The retry runs through this interceptor again, which shows any error it gets
      return api(original);
    }
    notifyError(error);
    throw error;
  }
);

/**
 * Client for the public auth endpoints (login, sign-up, password reset, email verification, ...).
 * No token handling, but the same base URL, timeout and error toasts as `api`.
 */
export const publicApi = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

publicApi.interceptors.response.use(
  (response) => response,
  (error) => {
    notifyError(error);
    throw error;
  }
);
