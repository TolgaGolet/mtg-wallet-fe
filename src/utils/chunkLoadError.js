// @ts-check

/** Name given to a lazy page or CSS file that failed to load (webpack used the same name). */
export const CHUNK_LOAD_ERROR = "ChunkLoadError";

/**
 * Marks every failed lazy load as a chunk error, so RouteError can offer a reload after a deploy.
 * Vite wraps each lazy `import()` in production and fires `vite:preloadError` when it fails (the
 * JS file, its CSS, or an HTML fallback served in its place), whatever the browser's wording.
 * Register it before anything is lazy-loaded.
 * @param {EventTarget} [target]
 */
export function markChunkLoadErrors(target = window) {
  target.addEventListener("vite:preloadError", (event) => {
    const error = /** @type {Event & { payload?: unknown }} */ (event).payload;
    if (error instanceof Error) error.name = CHUNK_LOAD_ERROR;
  });
}

/** @param {unknown} error */
export const isChunkLoadError = (error) =>
  error instanceof Error && error.name === CHUNK_LOAD_ERROR;
