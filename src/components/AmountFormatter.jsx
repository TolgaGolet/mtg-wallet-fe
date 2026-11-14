// @ts-check
import { NumberFormatter } from "@mantine/core";

/**
 * An amount with two decimals, "." as the decimal and "," as the thousands separator.
 * @param {{ prefix?: string, value?: number | string } & Omit<import("@mantine/core").NumberFormatterProps, "prefix" | "value">} props
 */
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
