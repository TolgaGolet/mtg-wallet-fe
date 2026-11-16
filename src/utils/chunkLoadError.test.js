import {
  CHUNK_LOAD_ERROR,
  isChunkLoadError,
  markChunkLoadErrors,
} from "./chunkLoadError";

const preloadError = (payload) => {
  const event = new Event("vite:preloadError", { cancelable: true });
  event.payload = payload;
  return event;
};

// Regression: chunk errors were recognized by the browser's message text, which missed Vite's
// "Unable to preload CSS" and the MIME-type error from an HTML fallback served for a deleted chunk
test.each([
  "Failed to fetch dynamically imported module: https://x/assets/Settings-abc.js",
  "Unable to preload CSS for /assets/Accounts-abc.css",
  'Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html".',
])("any failed lazy load Vite reports is a chunk error: %s", (message) => {
  const target = new EventTarget();
  markChunkLoadErrors(target);
  const error = new TypeError(message);

  target.dispatchEvent(preloadError(error));

  expect(error.name).toBe(CHUNK_LOAD_ERROR);
  expect(isChunkLoadError(error)).toBe(true);
});

test("a non-Error payload is left alone", () => {
  const target = new EventTarget();
  markChunkLoadErrors(target);

  expect(() => target.dispatchEvent(preloadError("boom"))).not.toThrow();
});

test("errors Vite didn't report are not chunk errors", () => {
  expect(
    isChunkLoadError(new TypeError("Cannot read properties of undefined"))
  ).toBe(false);
  expect(isChunkLoadError(undefined)).toBe(false);
});
