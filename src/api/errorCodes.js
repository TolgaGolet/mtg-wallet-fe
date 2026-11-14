// The backend sets this header to the GenericExceptionMessages constant name on expected errors,
// so the UI can react to a specific error without matching message text.
export const ERROR_CODE_HEADER = "X-Error-Code";

export const NOT_VERIFIED_EMAIL = "NOT_VERIFIED_EMAIL";

/** Takes an axios response. Real ones carry AxiosHeaders (case-insensitive get()); plain objects are for tests/mocks. */
export function getErrorCode(response) {
  const headers = response?.headers;
  if (!headers) {
    return null;
  }
  return typeof headers.get === "function"
    ? headers.get(ERROR_CODE_HEADER)
    : (headers[ERROR_CODE_HEADER.toLowerCase()] ?? null);
}
