import { useCallback, useLayoutEffect, useRef } from "react";

/**
 * Returns a function with a stable identity that always calls the latest `callback`.
 * Lets an effect depend only on the values that should trigger it, while still reading
 * current props and state (React's "effect event" pattern).
 */
export default function useStableCallback(callback) {
  const ref = useRef(callback);
  useLayoutEffect(() => {
    ref.current = callback;
  });
  return useCallback((...args) => ref.current(...args), []);
}
