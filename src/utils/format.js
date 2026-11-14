// Same rules as AmountFormatter: two decimals, "." decimal separator, "," thousands separator.
const amountFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats an amount as plain text (for select labels and aria-labels), e.g. 1234.5 -> "1,234.50". */
export function formatAmount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? amountFormat.format(number) : "";
}

/** Label for an account in a select, e.g. "Cash (1,234.50 TRY)". */
export function accountOptionLabel(account) {
  return `${account.name} (${formatAmount(account.balance)} ${
    account.currency?.value ?? ""
  })`;
}
