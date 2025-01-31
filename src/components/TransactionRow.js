import { Box, Card, Group, Stack, Text } from "@mantine/core";
import AmountFormatter from "./AmountFormatter";
import { Currency } from "../enum/Currency";

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
  const formattedDateTime = date.toLocaleTimeString("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const getColorBasedOnTypeValue = (typeValue) => {
    if (typeValue === "INC") {
      return "green";
    } else if (typeValue === "EXP") {
      return "red";
    } else {
      return "gray";
    }
  };

  return (
    <Card
      mb="xs"
      withBorder
      {...props}
      style={{
        cursor: "pointer",
        transition: "background-color 0.3s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor =
          "light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-4))";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "";
      }}
    >
      <Group justify="space-between" align="flex-start">
        <Box>
          <Text fw="700">{payee}</Text>
          <Text>
            {parentCategory ? category + " (" + parentCategory + ")" : category}
          </Text>
        </Box>
        <Stack align="flex-end" justify="flex-start" gap="xs">
          <Text>{formattedDateTime}</Text>
          <AmountFormatter
            prefix={Currency[currencyValue]?.symbol || currencyValue}
            value={amount}
            style={{
              fontWeight: "bold",
              color: getColorBasedOnTypeValue(typeValue),
            }}
          ></AmountFormatter>
        </Stack>
      </Group>
      {typeValue === "TRA" && (
        <Text>
          {sourceAccount} -&gt; {targetAccount}
        </Text>
      )}
    </Card>
  );
}
