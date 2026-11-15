// @ts-check
import { forwardRef } from "react";
import { NumberInput } from "@mantine/core";

/**
 * @typedef {object} AmountInputOwnProps
 * @property {import("@mantine/form").UseFormReturnType<any>} form the form the field belongs to
 * @property {string} fieldName the form field holding the amount
 * @property {string} [label]
 * @property {string} [placeholder]
 * @property {boolean} [required]
 * @property {number | string} [min] defaults to the backend's lowest amount
 * @property {number | string} [max] defaults to the backend's highest amount
 * @typedef {AmountInputOwnProps & Omit<import("@mantine/core").NumberInputProps, keyof AmountInputOwnProps>} AmountInputProps
 */

/** An amount field: 2 decimals, "." as the decimal and "," as the thousands separator. */
const AmountInput = forwardRef(function AmountInput(
  /** @type {AmountInputProps} */
  { label, placeholder, required, form, fieldName, min, max, ...props },
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
      // ?? and not ||, so min={0} still sets a minimum. The defaults are strings because they have
      // more digits than a JS number holds (Mantine's types only say number).
      max={/** @type {number} */ (max ?? "999999999999999.99")}
      min={/** @type {number} */ (min ?? "-999999999999999.99")}
      {...props}
    />
  );
});

export default AmountInput;
