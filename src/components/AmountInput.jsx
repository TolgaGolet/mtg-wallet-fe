// @ts-check
import { forwardRef } from "react";
import { NumberInput } from "@mantine/core";
import { AMOUNT_MAX } from "../validation/rules";

/**
 * @typedef {object} AmountInputOwnProps
 * @property {import("@mantine/form").UseFormReturnType<any>} form the form the field belongs to
 * @property {string} fieldName the form field holding the amount
 * @property {string} [label]
 * @property {string} [placeholder]
 * @property {boolean} [required]
 * @typedef {AmountInputOwnProps & Omit<import("@mantine/core").NumberInputProps, keyof AmountInputOwnProps>} AmountInputProps
 */

/**
 * An amount field: 2 decimals, "." as the decimal and "," as the thousands separator. Typing past
 * AMOUNT_MAX is blocked, but a value is never clamped (on blur Mantine would silently change a larger
 * stored amount): forms report range errors with their validators (`validateAmountMax`).
 */
const AmountInput = forwardRef(function AmountInput(
  /** @type {AmountInputProps} */
  { label, placeholder, required, form, fieldName, ...props },
  ref
) {
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
      required={required}
      decimalScale={2}
      fixedDecimalScale
      decimalSeparator="."
      allowedDecimalSeparators={[".", ","]}
      thousandSeparator=","
      hideControls
      inputMode="decimal"
      clampBehavior="none"
      isAllowed={({ floatValue }) =>
        floatValue === undefined || Math.abs(floatValue) <= AMOUNT_MAX
      }
      {...props}
    />
  );
});

export default AmountInput;
