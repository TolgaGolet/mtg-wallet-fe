import { Box, Card, Group, Stack, Text } from "@mantine/core";
import AmountFormatter from "./AmountFormatter";

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
  const formattedDateTime = date.toLocaleString("tr-TR");

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
    <Card mb="xs" withBorder {...props}>
      <Group justify="space-between" align="flex-start">
        <Box>
          <Text fw="500">{payee}</Text>
          <Text>
            {parentCategory ? category + " (" + parentCategory + ")" : category}
          </Text>
          {typeValue === "TRA" && (
            <Text>
              {sourceAccount} -&gt; {targetAccount}
            </Text>
          )}
        </Box>
        <Stack align="flex-end" justify="flex-start" gap="xs">
          <Text>{formattedDateTime}</Text>
          <AmountFormatter
            prefix={currencyValue}
            value={amount}
            style={{
              fontWeight: "bold",
              color: getColorBasedOnTypeValue(typeValue),
            }}
          ></AmountFormatter>
        </Stack>
      </Group>
    </Card>
  );
}
