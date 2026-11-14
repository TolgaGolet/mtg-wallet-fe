// @ts-check

/**
 * Loads one record with `POST <entity>/search { id }`. The backend answers an empty page (not a 404)
 * for an id that doesn't exist, was deleted or belongs to someone else, so that case throws a
 * NotFoundError (see `isNotFound`); `useApiQuery` then renders its error state instead of an empty form.
 *
 * @param {import("axios").AxiosInstance} callApi
 * @param {string} entity e.g. "account"
 * @param {string | number} id
 * @param {AbortSignal} [signal]
 * @returns {Promise<any>}
 */
export function fetchById(callApi, entity, id, signal) {
  return callApi
    .post(`${entity}/search`, { id }, { params: { pageNo: 0 }, signal })
    .then((response) => {
      const item = response.data?.content?.[0];
      if (!item) {
        throw new NotFoundError(entity);
      }
      return item;
    });
}

class NotFoundError extends Error {
  /** @param {string} entity */
  constructor(entity) {
    super(`${entity} not found`);
    this.name = "NotFoundError";
  }
}

/** True when `error` came from `fetchById` finding nothing. */
export const isNotFound = (/** @type {unknown} */ error) =>
  error instanceof NotFoundError;
