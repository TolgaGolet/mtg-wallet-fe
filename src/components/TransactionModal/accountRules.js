// @ts-check
import { idString } from "../../utils/ids";
// Which accounts a transaction may use. The backend enforces the same rules: a transfer needs a
// target account that differs from the source and has the same currency.

/**
 * @typedef {{ id: number, name: string, balance?: number, currency?: { value?: string } }} Account
 */

/**
 * The account whose id matches a Select value ("7"), if any.
 * @param {Account[]} accounts
 * @param {string | null | undefined} id
 * @returns {Account | undefined}
 */
export function findAccount(accounts, id) {
  return id
    ? accounts.find((account) => idString(account.id) === id)
    : undefined;
}

/**
 * The accounts a transfer from `sourceId` can go to: same currency, not the source itself.
 * @param {Account[]} accounts
 * @param {string | null | undefined} sourceId
 */
export function targetOptions(accounts, sourceId) {
  const sourceCurrency = findAccount(accounts, sourceId)?.currency?.value;
  return accounts.filter(
    (account) =>
      account.currency?.value === sourceCurrency &&
      idString(account.id) !== sourceId
  );
}
