import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import useAxios from "../../utils/useAxios";
import useStableCallback from "../../utils/useStableCallback";
import { sameName } from "../../utils/text";
import { isValidNameKeyword, validateEntityName } from "../../validation/rules";
import { NEW_PAYEE_OPTION_ID, NEW_PAYEE_POSTFIX } from "./transactionRequest";

/**
 * The search results plus a "<name> (New)" option when the typed name doesn't exist yet and is a
 * valid payee name (the backend's payeeName rule: 3-50 characters, NAME_REGULAR_EXPRESSION).
 */
export function withNewPayeeOption(request, page) {
  const content = (page?.content ?? []).filter(
    (p) => p.id !== NEW_PAYEE_OPTION_ID
  );
  const name = request?.name?.trim();
  if (
    name &&
    validateEntityName(name) === null &&
    !content.some((p) => sameName(p.name, name))
  ) {
    return [
      ...content,
      {
        name: name + NEW_PAYEE_POSTFIX,
        id: NEW_PAYEE_OPTION_ID,
      },
    ];
  }
  return content;
}

// Payees taken from a transaction carry category.id, search results carry categoryId; keep both usable
const addIfMissing = (list, payee) =>
  payee && !list.some((p) => p.id === payee.id)
    ? [
        ...list,
        { ...payee, categoryId: payee.categoryId ?? payee.category?.id },
      ]
    : list;

/**
 * Payee search for the transaction form: debounced, cached per keyword and type, and the
 * previous request is aborted when a new one starts. Only runs while `enabled` (the modal is open).
 *
 * `onKeywordChange(keyword, exactMatch)` runs for each debounced keyword, with the existing payee of
 * exactly that name (or null), so the form can lock the category to that payee's category.
 */
export default function usePayeeSearch(
  typeValue,
  { enabled, onKeywordChange }
) {
  const callApi = useAxios();
  const [payeeList, setPayeeList] = useState([]);
  const [isPayeeLoading, setIsPayeeLoading] = useState(false);
  const [keyword, setKeyword] = useState(null);
  const [debouncedKeyword] = useDebouncedValue(keyword, 500);
  const cacheRef = useRef({});
  const controllerRef = useRef(null);
  // The transaction type payeeList was searched for; an exact match only counts within that type
  const listTypeRef = useRef(null);

  const fetchPayees = (request, cacheKey) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsPayeeLoading(true);
    return callApi
      .post("payee/search", request, {
        params: { pageNo: 0 },
        signal: controller.signal,
      })
      .then((response) => {
        if (cacheKey) cacheRef.current[cacheKey] = response.data;
        return controller.signal.aborted ? null : response.data;
      })
      .catch(() => null) // the API client has shown the error
      .finally(() => {
        if (controllerRef.current === controller) setIsPayeeLoading(false);
      });
  };

  const search = useStableCallback((searchKeyword, type) => {
    // Picking the "(New)" option puts its label into the search box; that's not a new search
    if (searchKeyword && searchKeyword.includes(NEW_PAYEE_POSTFIX)) {
      return;
    }
    const exactMatchIn = (list) =>
      searchKeyword
        ? (list.find(
            (p) =>
              p.id !== NEW_PAYEE_OPTION_ID && sameName(p.name, searchKeyword)
          ) ?? null)
        : null;
    // After a type change the list still holds the other type's payees, so search again first
    const exactMatch =
      listTypeRef.current === type ? exactMatchIn(payeeList) : null;
    if (exactMatch) {
      onKeywordChange?.(searchKeyword, exactMatch);
      return;
    }
    const showResults = (page) => {
      const list = withNewPayeeOption(request, page);
      listTypeRef.current = type;
      setPayeeList(list);
      onKeywordChange?.(searchKeyword, exactMatchIn(list));
    };

    const request = { transactionTypeValue: type };
    if (searchKeyword && isValidNameKeyword(searchKeyword)) {
      request.name = searchKeyword;
    }
    const cacheKey = (searchKeyword || "") + type;
    const cached = cacheRef.current[cacheKey];
    if (cached) {
      showResults(cached);
      return;
    }
    fetchPayees(request, cacheKey).then((page) => {
      if (page) showResults(page);
    });
  });

  // Fresh results per opening: a payee created by the last save must not show up as "(New)" again.
  // Declared before the search effect so the cache is cleared before the first search runs.
  useEffect(() => {
    if (enabled) {
      cacheRef.current = {};
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      search(debouncedKeyword, typeValue);
    }
  }, [enabled, debouncedKeyword, typeValue, search]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  /** Makes sure a payee (e.g. the one of the transaction being edited) is selectable. */
  const addPayee = useCallback(
    (payee) => setPayeeList((list) => addIfMissing(list, payee)),
    []
  );

  return { payeeList, isPayeeLoading, setKeyword, addPayee };
}
