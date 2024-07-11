import { NumberFormatter } from "@mantine/core";

export default function AmountFormatter({ prefix, value, ...props }) {
  return (
    <NumberFormatter
      prefix={prefix ? prefix + " " : ""}
      value={value}
      decimalScale={2}
      fixedDecimalScale
      decimalSeparator="."
      thousandSeparator=","
      {...props}
    />
  );
}
