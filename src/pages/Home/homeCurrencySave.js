// @ts-check
import { useSyncExternalStore } from "react";
import { getErrorMessage, onSessionChange } from "../../api/client";
import showNotification from "../../components/showNotification";

// Saves the Home currency in the background.
// - Each pick is sent at once, tagged with this tab's id and a rising counter. The backend ignores a
//   pick older than the last one it saved from this tab, so overlapping saves, and one that commits
//   late after a client timeout, can't undo a newer pick.
// - Network errors, timeouts and 5xx are retried once (unless a newer pick replaced it); after that,
//   or on a 4xx, the user is told it wasn't saved.
// - The pick waiting to be saved lives outside Home, so leaving and coming back meanwhile still shows
//   it. Once it settles the backend's value counts again. It is dropped on logout or a user switch,
//   and `sessionUser` keeps the request from going out under another user's session.

const MAX_ATTEMPTS = 2;
const CLIENT_ID =
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
let lastSequence = 0;

/** @typedef {{ value: string, sequence: number }} Pick */

/** @type {Pick | null} The newest pick that hasn't settled yet. */
let pending = null;
const listeners = new Set();

/** @param {Pick | null} next */
function setPending(next) {
  pending = next;
  listeners.forEach((listener) => listener());
}

/** @param {() => void} listener */
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

onSessionChange(() => setPending(null));

/** @param {any} error */
const isRetryable = (error) => !error?.response || error.response.status >= 500;

/**
 * Saves `value` on the account in the background. Never rejects.
 *
 * @param {{ post: (url: string, body: unknown, config: object) => Promise<unknown> }} callApi
 * @param {string | undefined} sessionUser the username the pick belongs to (`user.sub`)
 * @param {string} value
 */
export async function saveHomeCurrency(callApi, sessionUser, value) {
  const pick = { value, sequence: ++lastSequence };
  setPending(pick);
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await callApi.post(
        "home/currency",
        { currencyValue: value, clientId: CLIENT_ID, sequence: pick.sequence },
        { silentErrors: true, sessionUser } // errors are shown below, once
      );
      break;
    } catch (error) {
      if (pending !== pick) {
        return; // replaced by a newer pick, or the session ended: nothing left to report
      }
      if (attempt === MAX_ATTEMPTS || !isRetryable(error)) {
        showNotification(
          getErrorMessage(
            error,
            "Couldn't save the currency. Please try again."
          ),
          "error"
        );
        break;
      }
    }
  }
  if (pending === pick) {
    setPending(null);
  }
}

/** @returns {{ pendingCurrency: string | null, saving: boolean }} the pick waiting to be saved */
export function useHomeCurrencySave() {
  const pick = useSyncExternalStore(subscribe, () => pending);
  return { pendingCurrency: pick?.value ?? null, saving: pick !== null };
}

/** Forgets the pending pick (tests: the module outlives a render). */
export function resetHomeCurrencySave() {
  setPending(null);
}
