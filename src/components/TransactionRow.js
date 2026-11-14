import { Box, Group, Stack, Text } from "@mantine/core";
import AmountFormatter from "./AmountFormatter";
import ClickableCard from "./ClickableCard";
import { Currency } from "../enum/Currency";
import { formatAmount } from "../utils/format";

const TYPES = {
  INC: { label: "Income", color: "green", sign: "+" },
  EXP: { label: "Expense", color: "red", sign: "−" },
  TRA: { label: "Transfer", color: "gray", sign: "" },
};

export default function TransactionRow({
  payee,
  category,
  parentCategory,
  typeValue,
  amount,
  currencyValue,
  dateTime,
  sourceAccount,
  targetAccount,
  ...props
}) {
  const date = new Date(dateTime);
  // The browser's locale, so each user sees their own date format
  const formattedDateTime = date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const type = TYPES[typeValue] ?? TYPES.TRA;
  const symbol = Currency[currencyValue]?.symbol || currencyValue;
  const categoryText = parentCategory
    ? category + " (" + parentCategory + ")"
    : category;
  const transferText =
    typeValue === "TRA" ? `${sourceAccount} → ${targetAccount}` : null;
  const ariaLabel = [
    type.label,
    payee,
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
          <Text fw="700">{payee}</Text>
          <Text>{categoryText}</Text>
        </Box>
        <Stack align="flex-end" justify="flex-start" gap="xs">
          <Text>{formattedDateTime}</Text>
          {/* The sign makes income and expense distinguishable without colour */}
          <AmountFormatter
            prefix={type.sign + (symbol ?? "")}
            value={amount}
            style={{ fontWeight: "bold", color: type.color }}
          ></AmountFormatter>
        </Stack>
      </Group>
      {transferText && <Text>{transferText}</Text>}
    </ClickableCard>
  );
}
