// @ts-check
import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";

/**
 * The "Delete this x?" confirmation every delete button opens; `onConfirm` runs on Confirm.
 * @param {{ label: string, message: string, onConfirm: () => void }} options
 */
export default function openDeleteConfirm({ label, message, onConfirm }) {
  modals.openConfirmModal({
    title: `Delete this ${label.toLowerCase()}?`,
    centered: true,
    children: <Text size="sm">{message}</Text>,
    labels: { confirm: "Confirm", cancel: "Cancel" },
    confirmProps: { color: "red" },
    onConfirm,
  });
}
