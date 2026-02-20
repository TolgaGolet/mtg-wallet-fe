import { forwardRef } from "react";
import { NumberInput } from "@mantine/core";

const AmountInput = forwardRef(function AmountInput({
  label,
  placeholder,
  required,
  form,
  fieldName,
  min,
  max,
  ...props
}, ref) {
  return (
    <NumberInput
      ref={ref}
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
});

export default AmountInput;
