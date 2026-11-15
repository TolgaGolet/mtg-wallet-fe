// @ts-check
import useAxios from "../../utils/useAxios";
import useApiQuery from "../../utils/useApiQuery";
import { fetchById } from "../../api/fetchById";

/**
 * `list` plus each of `extras` whose id it doesn't already contain.
 * @param {any[] | null | undefined} list
 * @param {any[]} extras
 */
const withMissing = (list, extras) => {
  const result = list ?? [];
  const missing = extras.filter(
    (extra) => extra && !result.some((item) => item.id === extra.id)
  );
  return missing.length ? [...result, ...missing] : result;
};

/**
 * Everything the transaction dialog needs, loaded in parallel (one round trip): the accounts and categories,
 * the recent transactions for the quick-pick suggestions (unless the parent already has them),
 * and in edit mode the transaction itself (a missing one is a not-found error).
 * `onLoaded(data)` fills the form. The dialog is mounted only while open, so each opening loads
 * fresh data.
 *
 * @param {number | null | undefined} transactionId null to create
 * @param {any[] | null | undefined} loadedRecentTransactions
 * @param {(data: TransactionFormData) => void} onLoaded
 */
export default function useTransactionFormData(
  transactionId,
  loadedRecentTransactions,
  onLoaded
) {
  const callApi = useAxios();
  const isEdit = transactionId !== null && transactionId !== undefined;

  return useApiQuery(
    async (signal) => {
      const [enums, recentTransactions, transaction] = await Promise.all([
        callApi
          .get("transaction/create/enums", { signal })
          .then((response) => response.data),
        loadedRecentTransactions ??
          callApi
            .post("transaction/search", {}, { params: { pageNo: 0 }, signal })
            .then((response) => response.data?.content ?? []),
        isEdit
          ? fetchById(callApi, "transaction", transactionId, signal)
          : null,
      ]);
      // The record's own category and accounts may no longer be offered (e.g. inactive); the
      // transaction already carries them, so add them to the options instead of loading them
      return {
        categoryList: withMissing(enums?.categoryList, [
          transaction?.payee?.category,
        ]),
        accountList: withMissing(enums?.accountList, [
          transaction?.sourceAccount,
          transaction?.targetAccount,
        ]),
        recentTransactions,
        transaction,
      };
    },
    [transactionId],
    { onSuccess: onLoaded }
  );
}

/**
 * @typedef {object} TransactionFormData
 * @property {any[]} categoryList
 * @property {import("./accountRules").Account[]} accountList
 * @property {any[]} recentTransactions
 * @property {any | null} transaction
 */
