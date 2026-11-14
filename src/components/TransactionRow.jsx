// @ts-check
import { Box, Group, Stack, Text } from "@mantine/core";
import AmountFormatter from "./AmountFormatter";
import ClickableCard from "./ClickableCard";
import { Currency } from "../enum/Currency";
import { TYPE, TYPE_LABEL } from "../enum/TransactionType";
import { categoryLabel, formatAmount } from "../utils/format";

const TYPES = {
  [TYPE.INCOME]: { label: TYPE_LABEL[TYPE.INCOME], color: "green", sign: "+" },
  [TYPE.EXPENSE]: { label: TYPE_LABEL[TYPE.EXPENSE], color: "red", sign: "−" },
  [TYPE.TRANSFER]: {
    label: TYPE_LABEL[TYPE.TRANSFER],
    color: "gray",
    sign: "",
  },
};

/**
 * A transaction as `POST transaction/search` returns it (only the fields the row reads).
 * @typedef {object} TransactionListItem
 * @property {number} id
 * @property {{ value: string }} [type]
 * @property {number} amount
 * @property {string} dateTime
 * @property {{ name?: string, category?: { name?: string, parentCategoryName?: string | null } }} [payee]
 * @property {{ name?: string, currency?: { value?: string } }} [sourceAccount]
 * @property {{ name?: string } | null} [targetAccount]
 */

/**
 * One transaction in a list. The currency is the source account's (a transfer's target always
 * has the same currency).
 * @param {{ transaction: TransactionListItem } & Omit<import("./ClickableCard").ClickableCardProps, "aria-label" | "children">} props
 */
export default function TransactionRow({ transaction, ...props }) {
  const { payee, type: transactionType, amount, dateTime } = transaction;
  const typeValue = transactionType?.value;
  const currencyValue = transaction.sourceAccount?.currency?.value;
  // The browser's locale, so each user sees their own date format
  const formattedDateTime = new Date(dateTime).toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const type = TYPES[typeValue] ?? TYPES[TYPE.TRANSFER];
  const symbol = Currency[currencyValue]?.symbol || currencyValue;
  const transferText =
    typeValue === TYPE.TRANSFER
      ? `${transaction.sourceAccount?.name} → ${transaction.targetAccount?.name}`
      : null;
  const ariaLabel = [
    type.label,
    payee?.name,
    `${type.sign}${symbol} ${formatAmount(amount)}`,
    formattedDateTime,
    transferText,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <ClickableCard mb="xs" withBorder aria-label={ariaLabel} {...props}>
      <Group justify="space-between" align="flex-start">
        <Box>
          <Text fw="700">{payee?.name}</Text>
          <Text>{categoryLabel(payee?.category)}</Text>
        </Box>
        <Stack align="flex-end" justify="flex-start" gap="xs">
          <Text>{formattedDateTime}</Text>
          {/* The sign makes income and expense distinguishable without colour */}
          <AmountFormatter
            prefix={type.sign + (symbol ?? "")}
            value={amount}
            style={{ fontWeight: "bold", color: type.color }}
          />
        </Stack>
      </Group>
      {transferText && <Text>{transferText}</Text>}
    </ClickableCard>
  );
}
