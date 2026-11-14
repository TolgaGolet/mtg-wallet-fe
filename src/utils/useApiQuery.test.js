import { act, renderHook, waitFor } from "@testing-library/react";
import useApiQuery from "./useApiQuery";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useApiQuery (FE-10)", () => {
  test("loads data and reports loading", async () => {
    const { result } = renderHook(() =>
      useApiQuery(() => Promise.resolve("data"))
    );

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe("data");
    expect(result.current.error).toBeNull();
  });

  test("a slow response for old inputs can't overwrite the newer one", async () => {
    const calls = {};
    const signals = {};
    const { result, rerender } = renderHook(
      ({ currency }) =>
        useApiQuery(
          (signal) => {
            calls[currency] = deferred();
            signals[currency] = signal;
            return calls[currency].promise;
          },
          [currency]
        ),
      { initialProps: { currency: "TRY" } }
    );
    await waitFor(() => expect(calls.TRY).toBeDefined());

    rerender({ currency: "USD" });
    await waitFor(() => expect(calls.USD).toBeDefined());
    expect(signals.TRY.aborted).toBe(true);

    await act(async () => {
      calls.USD.resolve("usd value");
      calls.TRY.resolve("try value"); // arrives last, must be ignored
    });

    expect(result.current.data).toBe("usd value");
  });

  test("errors are reported and retry loads again", async () => {
    let attempt = 0;
    const { result } = renderHook(() =>
      useApiQuery(() => {
        attempt += 1;
        return attempt === 1
          ? Promise.reject(new Error("down"))
          : Promise.resolve("ok");
      })
    );
    await waitFor(() => expect(result.current.error).toBeTruthy());

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.data).toBe("ok"));
    expect(result.current.error).toBeNull();
  });

  test("onSuccess runs for the current request only", async () => {
    const onSuccess = jest.fn();
    const first = deferred();
    let call = 0;
    const { rerender } = renderHook(
      ({ id }) =>
        useApiQuery(
          () => {
            call += 1;
            return call === 1 ? first.promise : Promise.resolve(`item ${id}`);
          },
          [id],
          { onSuccess }
        ),
      { initialProps: { id: 1 } }
    );

    rerender({ id: 2 });
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("item 2"));
    await act(async () => first.resolve("item 1"));

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  test("aborts the request on unmount", async () => {
    let signal;
    const { unmount } = renderHook(() =>
      useApiQuery((s) => {
        signal = s;
        return new Promise(() => {});
      })
    );
    await waitFor(() => expect(signal).toBeDefined());

    unmount();

    expect(signal.aborted).toBe(true);
  });

  // Transactions' Search button: same filter must reload, a new filter must still fetch only once
  test("retry together with a deps change fetches once; retry alone refetches", async () => {
    let fetches = 0;
    const { result, rerender } = renderHook(
      ({ filter }) =>
        useApiQuery(() => {
          fetches += 1;
          return Promise.resolve(filter);
        }, [filter]),
      { initialProps: { filter: { a: 1 } } }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetches).toBe(1);

    // Same content, new object: no refetch on its own
    rerender({ filter: { a: 1 } });
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetches).toBe(2);

    act(() => {
      result.current.retry();
      rerender({ filter: { a: 2 } });
    });
    await waitFor(() => expect(result.current.data).toEqual({ a: 2 }));
    expect(fetches).toBe(3);
  });
});
