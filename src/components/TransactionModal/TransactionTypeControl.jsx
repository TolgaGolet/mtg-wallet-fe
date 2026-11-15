// @ts-check
import { Center, rem, SegmentedControl, useMantineTheme } from "@mantine/core";
import { IconCash, IconReceipt, IconTransfer } from "@tabler/icons-react";
import { TYPE, TYPE_OPTIONS } from "../../enum/TransactionType";

// The type switch's icon and icon colour per type (labels come from TYPE_OPTIONS)
const TYPE_ICONS = {
  [TYPE.EXPENSE]: { Icon: IconReceipt, color: "red" },
  [TYPE.INCOME]: { Icon: IconCash, color: "green" },
  [TYPE.TRANSFER]: { Icon: IconTransfer, color: "blue" },
};

/**
 * The expense / income / transfer switch at the top of the transaction dialog.
 *
 * @param {object} props
 * @param {string} props.value a TYPE value
 * @param {(value: string) => void} props.onChange
 * @param {boolean} [props.disabled]
 */
export default function TransactionTypeControl({ value, onChange, disabled }) {
  const theme = useMantineTheme();
  return (
    <SegmentedControl
      value={value}
      onChange={onChange}
      fullWidth
      disabled={disabled}
      aria-label="Transaction type"
      data={TYPE_OPTIONS.map((option) => {
        const { Icon, color } = TYPE_ICONS[option.value];
        return {
          value: option.value,
          label: (
            <Center style={{ gap: 10 }}>
              <Icon
                aria-hidden
                style={{
                  width: rem(16),
                  height: rem(16),
                  color: theme.colors[color][6],
                }}
              />
              <span>{option.label}</span>
            </Center>
          ),
        };
      })}
    />
  );
}
