import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Loads data for a component. `fetcher(signal)` returns a promise of the data and should pass
 * `signal` to the API call. The request re-runs when `deps` change and is aborted when they change
 * again or the component unmounts, so a late response can never overwrite newer data.
 * `onSuccess(data)` runs only for the current request (e.g. to fill a form).
 * The API client has already shown the error toast when `error` is set.
 */
export default function useApiQuery(fetcher, deps = [], { onSuccess } = {}) {
  const fetcherRef = useRef(fetcher);
  const onSuccessRef = useRef(onSuccess);
  fetcherRef.current = fetcher;
  onSuccessRef.current = onSuccess;

  const [state, setState] = useState({
    data: undefined,
    loading: true,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify(deps);

  useEffect(() => {
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
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, retry };
}
