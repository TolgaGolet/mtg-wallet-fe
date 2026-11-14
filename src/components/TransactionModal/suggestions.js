import { sameName } from "../../utils/text";

/** Recent transactions with one entry per payee name (the first, i.e. most recent, one wins). */
export function uniqueByPayee(transactions = []) {
  const seen = [];
  return transactions.filter((transaction) => {
    const name = transaction.payee?.name;
    if (!name || seen.some((other) => sameName(other, name))) {
      return false;
    }
    seen.push(name);
    return true;
  });
}

/** Payees from recent transactions of this type, for the quick-pick badges. */
export function suggestedPayees(transactions, typeValue, limit = 5) {
  return uniqueByPayee(transactions)
    .filter((transaction) => transaction.type?.value === typeValue)
    .slice(0, limit)
    .map((transaction) => transaction.payee);
}

/** Distinct source accounts from recent transactions, most recent first. */
export function suggestedAccounts(transactions = [], limit = 2) {
  const seen = new Set();
  const accounts = [];
  for (const transaction of transactions) {
    const account = transaction.sourceAccount;
    if (account?.id && !seen.has(account.id)) {
      seen.add(account.id);
      accounts.push(account);
    }
    if (accounts.length === limit) break;
  }
  return accounts;
}
