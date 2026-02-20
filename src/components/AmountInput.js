import { NumberInput } from "@mantine/core";

export default function AmountInput({
  label,
  placeholder,
  required,
  form,
  fieldName,
  min,
  max,
  ...props
}) {
  return (
    <NumberInput
      label={label || "Amount"}
      placeholder={placeholder || "Amount"}
      {...form.getInputProps(fieldName)}
      required={required || false}
      decimalScale={2}
      fixedDecimalScale
      decimalSeparator="."
      allowedDecimalSeparators={[".", ","]}
      thousandSeparator=","
      hideControls
      inputMode="decimal"
      max={max || "999999999999999.99"}
      min={min || "-999999999999999.99"}
      // clampBehavior="strict"
      {...props}
    />
  );
}
