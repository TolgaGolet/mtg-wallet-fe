import { AxiosError, AxiosHeaders } from "axios";
import showNotification from "../components/showNotification";
import {
  api,
  configureAuth,
  getErrorMessage,
  NETWORK_ERROR_MESSAGE,
  publicApi,
  refreshClient,
} from "./client";
import { getErrorCode, NOT_VERIFIED_EMAIL } from "./errorCodes";
import { fakeJwt } from "../test/jwt";

vi.mock("../components/showNotification", () => ({ default: vi.fn() }));

const TOKENS_KEY = "testAuthTokens";

const valid = (name) => fakeJwt(name);
const expired = (name) => fakeJwt(name, -60);

function storeTokens(accessToken, refreshToken = valid("refresh")) {
  localStorage.setItem(
    TOKENS_KEY,
    JSON.stringify({ accessToken, refreshToken })
  );
}

function httpError(config, status, data = "An error occurred: boom. 1") {
  return new AxiosError("fail", AxiosError.ERR_BAD_RESPONSE, config, null, {
    status,
    data,
    config,
    headers: {},
  });
}

function networkError(config) {
  return new AxiosError("Network Error", AxiosError.ERR_NETWORK, config);
}

const ok = (config, data = {}) => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config,
});

const bearer = (config) => config.headers.Authorization;

let onAuthFailure;
let onTokensRefreshed;
let apiCalls;
let refreshCalls;

beforeEach(() => {
  vi.stubEnv("VITE_AUTH_TOKENS_LOCAL_STORAGE_KEY", TOKENS_KEY);
  vi.stubEnv("VITE_REFRESH_TOKEN_URL", "auth/refresh-token");
  localStorage.clear();
  showNotification.mockClear();
  onAuthFailure = vi.fn();
  onTokensRefreshed = vi.fn();
  configureAuth({ onAuthFailure, onTokensRefreshed });
  apiCalls = [];
  refreshCalls = 0;
  api.defaults.adapter = async (config) => {
    apiCalls.push(bearer(config));
    return ok(config);
  };
});

/** Refresh endpoint that hands out access-1, access-2, ... */
function refreshSucceeds({ delayMs = 0 } = {}) {
  refreshClient.defaults.adapter = async (config) => {
    refreshCalls += 1;
    const n = refreshCalls;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return ok(config, {
      accessToken: valid(`access-${n}`),
      refreshToken: valid(`refresh-${n}`),
    });
  };
}

const subOf = (authHeader) =>
  JSON.parse(atob(authHeader.split(" ")[1].split(".")[1])).sub;

describe("token refresh (FE-01)", () => {
  test("refreshes again on the second expiry instead of reusing the first result", async () => {
    refreshSucceeds();
    storeTokens(expired("access-0"));

    await api.get("home/enums");
    expect(refreshCalls).toBe(1);
    expect(subOf(apiCalls[0])).toBe("access-1");

    // Time passes and the new access token expires too
    storeTokens(expired("access-1"));
    await api.get("home/enums");

    expect(refreshCalls).toBe(2);
    expect(subOf(apiCalls[1])).toBe("access-2");
    expect(onTokensRefreshed).toHaveBeenCalledTimes(2);
  });

  test("concurrent requests share one refresh", async () => {
    refreshSucceeds({ delayMs: 20 });
    storeTokens(expired("access-0"));

    await Promise.all([api.get("a"), api.post("b", {}), api.get("c")]);

    expect(refreshCalls).toBe(1);
    expect(apiCalls.map(subOf)).toEqual(["access-1", "access-1", "access-1"]);
  });

  test("a refresh that fails on the network doesn't poison later refreshes or log out", async () => {
    refreshClient.defaults.adapter = async (config) => {
      refreshCalls += 1;
      throw networkError(config);
    };
    storeTokens(expired("access-0"));

    await expect(api.get("a")).rejects.toBeDefined();
    expect(onAuthFailure).not.toHaveBeenCalled();
    expect(showNotification).toHaveBeenCalledWith(
      NETWORK_ERROR_MESSAGE,
      "error"
    );

    // The failed attempt counted as refresh #1, so a real second refresh hands out access-2
    refreshSucceeds();
    await api.get("a");
    expect(refreshCalls).toBe(2);
    expect(subOf(apiCalls[0])).toBe("access-2");
  });

  test("retries once with fresh tokens when the server answers 401", async () => {
    refreshSucceeds();
    storeTokens(valid("access-0"));
    let first = true;
    api.defaults.adapter = async (config) => {
      apiCalls.push(bearer(config));
      if (first) {
        first = false;
        throw httpError(config, 401);
      }
      return ok(config);
    };

    await api.get("a");

    expect(refreshCalls).toBe(1);
    expect(apiCalls.map(subOf)).toEqual(["access-0", "access-1"]);
  });

  test("logs out when the server rejects the refresh (401, e.g. revoked after account deletion)", async () => {
    refreshClient.defaults.adapter = async (config) => {
      refreshCalls += 1;
      throw httpError(config, 401);
    };
    storeTokens(expired("access-0"));

    await expect(api.get("a")).rejects.toMatchObject({ isAuthFailure: true });

    expect(refreshCalls).toBe(1);
    expect(onAuthFailure).toHaveBeenCalledTimes(1);
    expect(showNotification).not.toHaveBeenCalled();
  });

  // Regression: any server answer used to log out, so a cold start (502) or rate limit (429) ended the session
  test.each([429, 500, 502])(
    "stays logged in when the refresh gets a transient %i",
    async (status) => {
      refreshClient.defaults.adapter = async (config) => {
        refreshCalls += 1;
        throw httpError(config, status);
      };
      storeTokens(expired("access-0"));

      await expect(api.get("a")).rejects.toBeDefined();

      expect(onAuthFailure).not.toHaveBeenCalled();
      expect(showNotification).toHaveBeenCalled();
    }
  );

  // Regression: a 401 arriving after the logout started another refresh and logged out again
  test("a late 401 after the logout cleared the tokens doesn't log out again", async () => {
    refreshClient.defaults.adapter = async (config) => {
      refreshCalls += 1;
      throw httpError(config, 401);
    };
    onAuthFailure.mockImplementation(() => localStorage.removeItem(TOKENS_KEY));
    storeTokens(expired("access-0"));
    await expect(api.get("a")).rejects.toBeDefined();

    api.defaults.adapter = async (config) => {
      throw httpError(config, 401);
    };
    await expect(api.get("late")).rejects.toMatchObject({
      isAuthFailure: true,
    });

    expect(onAuthFailure).toHaveBeenCalledTimes(1);
  });

  test("logs out without calling the server when the refresh token has expired", async () => {
    refreshSucceeds();
    storeTokens(expired("access-0"), expired("refresh-0"));

    await expect(api.get("a")).rejects.toMatchObject({ isAuthFailure: true });

    expect(refreshCalls).toBe(0);
    expect(onAuthFailure).toHaveBeenCalledTimes(1);
  });

  test("corrupted stored tokens are treated as logged out instead of crashing", async () => {
    localStorage.setItem(TOKENS_KEY, "{not json");

    await api.get("public");

    expect(apiCalls).toEqual([undefined]);
    expect(localStorage.getItem(TOKENS_KEY)).toBeNull();
  });
});

describe("error toasts (FE-02)", () => {
  test("shows a network error toast when there is no response", async () => {
    api.defaults.adapter = async (config) => {
      throw networkError(config);
    };

    await expect(api.get("a")).rejects.toBeDefined();

    expect(showNotification).toHaveBeenCalledWith(
      NETWORK_ERROR_MESSAGE,
      "error"
    );
  });

  test("only passes string bodies to the toast", async () => {
    api.defaults.adapter = async (config) => {
      throw httpError(config, 400, { some: "object" });
    };

    await expect(api.get("a")).rejects.toBeDefined();

    expect(showNotification).not.toHaveBeenCalled();
  });
});

test("Date fields are sent as local wall-clock time on a copy (FE-14)", async () => {
  let sentData;
  api.defaults.adapter = async (config) => {
    sentData = JSON.parse(config.data);
    return ok(config);
  };
  const date = new Date(2026, 6, 15, 9, 30, 0); // 15 July 2026, 09:30 local time
  const body = { dateTime: date, notes: "x" };

  await api.post("transaction/create", body);

  expect(sentData).toEqual({ dateTime: "2026-07-15T09:30:00", notes: "x" });
  expect(body.dateTime).toBe(date);
});

describe("getErrorCode (FE-06)", () => {
  test("reads the header through AxiosHeaders.get, whatever its casing", () => {
    const response = {
      headers: new AxiosHeaders({ "X-Error-Code": NOT_VERIFIED_EMAIL }),
    };
    expect(getErrorCode(response)).toBe(NOT_VERIFIED_EMAIL);
  });

  test("reads the header from a plain headers object", () => {
    expect(getErrorCode({ headers: { "x-error-code": "X" } })).toBe("X");
  });

  test("returns null when there is no code", () => {
    expect(getErrorCode({ headers: {} })).toBeNull();
    expect(getErrorCode(undefined)).toBeNull();
  });
});

describe("publicApi (FE-11)", () => {
  test("sends no token and shows the server's message", async () => {
    storeTokens(valid("access-0"));
    let authHeader = "unset";
    publicApi.defaults.adapter = async (config) => {
      authHeader = config.headers.Authorization;
      throw httpError(config, 400, "An error occurred: Bad credentials. 7");
    };

    await expect(
      publicApi.post("auth/authenticate", { username: "a" })
    ).rejects.toBeDefined();

    expect(authHeader).toBeUndefined();
    expect(showNotification).toHaveBeenCalledWith(
      "An error occurred: Bad credentials. 7",
      "error"
    );
  });

  test("silentErrors skips the toast for pages that show the error themselves", async () => {
    publicApi.defaults.adapter = async (config) => {
      throw httpError(config, 400, "Token expired");
    };

    const error = await publicApi
      .post("email-verification/verify/x", {}, { silentErrors: true })
      .catch((e) => e);

    expect(showNotification).not.toHaveBeenCalled();
    expect(getErrorMessage(error)).toBe("Token expired");
  });

  test("getErrorMessage falls back when the body isn't text", () => {
    expect(getErrorMessage({ response: { data: { a: 1 } } }, "fallback")).toBe(
      "fallback"
    );
    expect(getErrorMessage(new Error("network"))).toBe("Something went wrong");
  });
});

describe("refresh across browser tabs (F4)", () => {
  afterEach(() => {
    delete navigator.locks;
  });

  // Another tab held the refresh lock and stored new tokens before this tab got it
  test("uses the tokens another tab refreshed instead of refreshing again", async () => {
    refreshSucceeds();
    storeTokens(expired("access-0"));
    navigator.locks = {
      request: async (name, task) => {
        expect(name).toBe("mtg-wallet-token-refresh");
        storeTokens(valid("access-other"), valid("refresh-other"));
        return task();
      },
    };

    await api.get("a");

    expect(refreshCalls).toBe(0);
    expect(subOf(apiCalls[0])).toBe("access-other");
    expect(onAuthFailure).not.toHaveBeenCalled();
  });

  // Regression: the losing tab got a 401 (its refresh token was revoked by the other tab's
  // refresh), logged out, and that logout revoked the other tab's new tokens too
  test("a refresh rejected because another tab refreshed first keeps the session", async () => {
    refreshClient.defaults.adapter = async (config) => {
      refreshCalls += 1;
      storeTokens(valid("access-other"), valid("refresh-other"));
      throw httpError(config, 401);
    };
    storeTokens(expired("access-0"));

    await api.get("a");

    expect(onAuthFailure).not.toHaveBeenCalled();
    expect(subOf(apiCalls[0])).toBe("access-other");
    expect(showNotification).not.toHaveBeenCalled();
  });

  // Regression: a 401 caused by another tab's rotation (which revoked the token this request sent)
  // made this tab refresh again with the new tokens, revoking the other tab's fresh ones
  test("a 401 after another tab rotated the tokens adopts them instead of refreshing", async () => {
    refreshSucceeds();
    storeTokens(valid("access-0"), valid("refresh-0"));
    api.defaults.adapter = async (config) => {
      apiCalls.push(bearer(config));
      if (subOf(bearer(config)) === "access-0") {
        // Another tab refreshed while this request was in flight
        storeTokens(valid("access-other"), valid("refresh-other"));
        throw httpError(config, 401);
      }
      return ok(config);
    };

    await api.get("a");

    expect(refreshCalls).toBe(0);
    expect(apiCalls.map(subOf)).toEqual(["access-0", "access-other"]);
    expect(onAuthFailure).not.toHaveBeenCalled();
  });
});
