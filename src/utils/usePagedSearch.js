// @ts-check
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useAxios from "./useAxios";
import useApiQuery from "./useApiQuery";
import useStableCallback from "./useStableCallback";

export const PAGE_PARAM = "page";

/** `?page=` is 1-based for people; anything missing or invalid is the first page. */
const parsePageNo = (value) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 1 ? page - 1 : 0;
};

/**
 * Loads one page of `POST <path>` (body = filters, `params: { pageNo }`) and keeps the page in the
 * URL (`?page=`), so it survives going back to the list, a refresh or a shared link. Other search
 * params are left alone. When a delete empties the last page, it moves to the page that is now last.
 * A changed body (new filters) starts at the first page, in the same render, so it fetches once.
 *
 * @param {string} path e.g. "payee/search"
 * @param {object} [body] the filters; compared by value, so a new object with the same fields doesn't refetch
 */
export default function usePagedSearch(path, body = {}) {
  const callApi = useAxios();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPageNo = parsePageNo(searchParams.get(PAGE_PARAM));
  // The body the URL's page was picked for. Until the URL catches up with a new body, read page 0.
  const bodyKey = JSON.stringify(body);
  const [pageBodyKey, setPageBodyKey] = useState(bodyKey);
  const isNewBody = pageBodyKey !== bodyKey;
  const pageNo = isNewBody ? 0 : urlPageNo;

  // Stable, so the effect below can list it without re-running on every render
  const setPageNo = useStableCallback(
    (/** @type {number} 0-based */ nextPageNo) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (nextPageNo > 0) {
            next.set(PAGE_PARAM, String(nextPageNo + 1));
          } else {
            next.delete(PAGE_PARAM);
          }
          return next;
        },
        // Paging isn't a new place in history: Back leaves the list
        { replace: true }
      )
  );

  useEffect(() => {
    if (!isNewBody) return;
    if (urlPageNo > 0) {
      setPageNo(0); // same page as already fetched, so no second request
    } else {
      setPageBodyKey(bodyKey);
    }
  }, [isNewBody, urlPageNo, bodyKey, setPageNo]);

  const query = useApiQuery(
    (signal) =>
      callApi
        .post(path, body, { params: { pageNo }, signal })
        .then((response) => response.data),
    [path, body, pageNo],
    {
      onSuccess: (page) => {
        if (pageNo > 0 && !page?.content?.length) {
          setPageNo(Math.max((page?.totalPages ?? 0) - 1, 0));
        }
      },
    }
  );

  /** Search again from the first page: moves there, or reloads when already on it. */
  const reload = () => (pageNo > 0 ? setPageNo(0) : query.retry());

  return {
    ...query,
    /** @type {any[]} */
    items: query.data?.content ?? [],
    /** @type {number} */
    totalPages: query.data?.totalPages ?? 0,
    /** @type {number} */
    totalElements: query.data?.totalElements ?? 0,
    pageNo,
    setPageNo,
    reload,
  };
}
