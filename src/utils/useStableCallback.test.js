import { renderHook } from "@testing-library/react";
import useStableCallback from "./useStableCallback";

test("keeps the same function identity across renders", () => {
  const { result, rerender } = renderHook(({ cb }) => useStableCallback(cb), {
    initialProps: { cb: () => 1 },
  });
  const first = result.current;

  rerender({ cb: () => 2 });

  expect(result.current).toBe(first);
});

test("calls the latest callback with the given arguments and returns its result", () => {
  const { result, rerender } = renderHook(({ cb }) => useStableCallback(cb), {
    initialProps: { cb: (a, b) => `old ${a} ${b}` },
  });
  const stable = result.current;

  rerender({ cb: (a, b) => `new ${a} ${b}` });

  expect(stable("x", "y")).toBe("new x y");
});
