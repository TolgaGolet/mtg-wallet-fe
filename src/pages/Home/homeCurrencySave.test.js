import { act, renderHook } from "@testing-library/react";
import {
  resetHomeCurrencySave,
  saveHomeCurrency,
  useHomeCurrencySave,
} from "./homeCurrencySave";
import { notifySessionChange } from "../../api/client";
import showNotification from "../../components/showNotification";

vi.mock("../../components/showNotification", () => ({ default: vi.fn() }));

const networkError = () => Promise.reject(new Error("Network Error"));
const serverError = () => Promise.reject({ response: { status: 503 } });
const badRequest = () =>
  Promise.reject({
    response: { status: 400, data: "An error occurred: Invalid request." },
  });

/** A post whose calls stay pending until settled, oldest first. */
function heldPost() {
  const pending = [];
  const post = vi.fn(
    () => new Promise((resolve, reject) => pending.push({ resolve, reject }))
  );
  return {
    post,
    finishNext: () => act(async () => pending.shift().resolve({ data: null })),
    failNext: (error) => act(async () => pending.shift().reject(error)),
  };
}

const bodies = (post) => post.mock.calls.map(([, body]) => body);

beforeEach(() => {
  resetHomeCurrencySave();
  vi.mocked(showNotification).mockReset();
});

describe("saveHomeCurrency", () => {
  test("posts the pick with a client id, a sequence and the session user, without the client's toast", async () => {
    const post = vi.fn().mockResolvedValue({ data: null });

    await saveHomeCurrency({ post }, "ada", "USD");

    expect(post).toHaveBeenCalledWith(
      "home/currency",
      {
        currencyValue: "USD",
        clientId: expect.any(String),
        sequence: expect.any(Number),
      },
      { silentErrors: true, sessionUser: "ada" }
    );
    expect(showNotification).not.toHaveBeenCalled();
  });

  test("every pick from this tab carries the same client id and a higher sequence", async () => {
    const post = vi.fn().mockResolvedValue({ data: null });

    await saveHomeCurrency({ post }, "ada", "USD");
    await saveHomeCurrency({ post }, "ada", "EUR");

    const [first, second] = bodies(post);
    expect(second.clientId).toBe(first.clientId);
    expect(second.sequence).toBeGreaterThan(first.sequence);
  });

  test("a network error is retried once and a successful retry shows nothing", async () => {
    const post = vi
      .fn()
      .mockImplementationOnce(networkError)
      .mockResolvedValueOnce({ data: null });

    await saveHomeCurrency({ post }, "ada", "USD");

    expect(post).toHaveBeenCalledTimes(2);
    expect(bodies(post)[1]).toEqual(bodies(post)[0]); // same pick, same sequence
    expect(showNotification).not.toHaveBeenCalled();
  });

  test("two server errors in a row tell the user once with the fallback message", async () => {
    const post = vi.fn().mockImplementation(serverError);

    await saveHomeCurrency({ post }, "ada", "USD");

    expect(post).toHaveBeenCalledTimes(2);
    expect(showNotification).toHaveBeenCalledTimes(1);
    expect(showNotification).toHaveBeenCalledWith(
      "Couldn't save the currency. Please try again.",
      "error"
    );
  });

  test("a 4xx is not retried and shows the server's message", async () => {
    const post = vi.fn().mockImplementation(badRequest);

    await saveHomeCurrency({ post }, "ada", "USD");

    expect(post).toHaveBeenCalledTimes(1);
    expect(showNotification).toHaveBeenCalledWith(
      "An error occurred: Invalid request.",
      "error"
    );
  });

  test("a failed save replaced by a newer pick is neither retried nor reported", async () => {
    const held = heldPost();
    const first = saveHomeCurrency(held, "ada", "USD");
    const second = saveHomeCurrency(held, "ada", "EUR");

    await held.failNext({ response: { status: 500 } }); // USD fails after EUR was picked
    await first;
    await held.finishNext(); // EUR
    await second;

    expect(held.post).toHaveBeenCalledTimes(2);
    expect(showNotification).not.toHaveBeenCalled();
  });

  test("never rejects, even when every attempt fails", async () => {
    const post = vi.fn().mockImplementation(networkError);

    await expect(saveHomeCurrency({ post }, "ada", "USD")).resolves.toBe(
      undefined
    );
  });
});

describe("useHomeCurrencySave", () => {
  test("shows the pick while it is being saved and forgets it once saved", async () => {
    const held = heldPost();
    const { result } = renderHook(() => useHomeCurrencySave());
    expect(result.current).toEqual({ pendingCurrency: null, saving: false });

    let save;
    act(() => {
      save = saveHomeCurrency(held, "ada", "EUR");
    });
    expect(result.current).toEqual({ pendingCurrency: "EUR", saving: true });

    await held.finishNext();
    await act(() => save);
    expect(result.current).toEqual({ pendingCurrency: null, saving: false });
  });

  test("the newest of overlapping picks is shown until it settles", async () => {
    const held = heldPost();
    const { result } = renderHook(() => useHomeCurrencySave());

    let first;
    let second;
    act(() => {
      first = saveHomeCurrency(held, "ada", "USD");
      second = saveHomeCurrency(held, "ada", "EUR");
    });
    await held.finishNext(); // the older USD save settles first
    await act(() => first);
    expect(result.current.pendingCurrency).toBe("EUR");

    await held.finishNext();
    await act(() => second);
    expect(result.current.pendingCurrency).toBeNull();
  });

  test("a session change (logout or user switch) drops the pending pick without reporting its failure", async () => {
    const held = heldPost();
    const { result } = renderHook(() => useHomeCurrencySave());

    let save;
    act(() => {
      save = saveHomeCurrency(held, "ada", "USD");
    });
    act(() => notifySessionChange());
    expect(result.current.pendingCurrency).toBeNull();

    await held.failNext({ response: { status: 500 } });
    await act(() => save);
    expect(held.post).toHaveBeenCalledTimes(1);
    expect(showNotification).not.toHaveBeenCalled();
  });
});
