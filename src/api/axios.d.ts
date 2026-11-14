// Request options this app's interceptors read (see client.js)
import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    /** The page shows the error itself, so the client shows no toast. */
    silentErrors?: boolean;
    /** Set on the retry after a token refresh, so a request is retried only once. */
    _retry?: boolean;
  }
}
