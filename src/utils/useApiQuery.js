// @ts-check
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Loads data for a component. `fetcher(signal)` returns a promise of the data and should pass
 * `signal` to the API call. The request re-runs when `deps` change and is aborted when they change
 * again or the component unmounts, so a late response can never overwrite newer data.
 * `onSuccess(data)` runs only for the current request (e.g. to fill a form).
 * While `enabled` is false (e.g. an input isn't known yet) nothing is requested and the query is
 * idle: no data, not loading.
 * The API client has already shown the error toast when `error` is set.
 *
 * @template T
 * @param {(signal: AbortSignal) => Promise<T> | T} fetcher
 * @param {unknown[]} [deps]
 * @param {{ onSuccess?: (data: T) => void, enabled?: boolean }} [options]
 * @returns {{ data: T | undefined, loading: boolean, error: any, retry: () => void }}
 */
export default function useApiQuery(
  fetcher,
  deps = [],
  { onSuccess, enabled = true } = {}
) {
  const fetcherRef = useRef(fetcher);
  const onSuccessRef = useRef(onSuccess);
  fetcherRef.current = fetcher;
  onSuccessRef.current = onSuccess;

  const [state, setState] = useState(
    /** @type {{ data: T | undefined, loading: boolean, error: any }} */ ({
      data: undefined,
      loading: enabled,
      error: null,
    })
  );
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify(deps);

  useEffect(() => {
    if (!enabled) {
      setState({ data: undefined, loading: false, error: null });
      return undefined;
    }
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));
    Promise.resolve()
      .then(() => fetcherRef.current(controller.signal))
      .then((data) => {
        if (controller.signal.aborted) return;
        setState({ data, loading: false, error: null });
        onSuccessRef.current?.(data);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setState((prev) => ({ ...prev, loading: false, error }));
      });
    return () => controller.abort();
  }, [key, attempt, enabled]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, retry };
}
