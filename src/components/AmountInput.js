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
  const inputProps = form.getInputProps(fieldName);
  // Mantine's NumberInput warns when `value` is null. Normalize null/undefined
  // to an empty string so the input behaves as an uncontrolled-empty field.
  const normalizedProps = {
    ...inputProps,
    value: inputProps.value == null ? "" : inputProps.value,
  };
  return (
    <NumberInput
      ref={ref}
      label={label || "Amount"}
      placeholder={placeholder || "Amount"}
      {...normalizedProps}
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
