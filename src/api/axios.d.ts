// Request options this app's interceptors read (see client.js)
import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    /** The page shows the error itself, so the client shows no toast. */
    silentErrors?: boolean;
    /** The request is cancelled unless the token it would carry (after any refresh) is this user's (`user.sub`). */
    sessionUser?: string;
    /** Set on the retry after a token refresh, so a request is retried only once. */
    _retry?: boolean;
  }
}
