import { NumberInput } from "@mantine/core";

export default function AmountInput({
  label,
  placeholder,
  required,
  form,
  fieldName,
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
      thousandSeparator=","
      hideControls
      max={"999999999999999.99"}
      min={"-999999999999999.99"}
      clampBehavior="strict"
      {...props}
    />
  );
}
