// @ts-check
import { lazy, Suspense, useEffect } from "react";
import { Center, Loader, Modal } from "@mantine/core";

// The dialog and @mantine/dates' DateTimePicker aren't in the main bundle (not with the login
// page). Pages that can open it start the download once they've rendered, so the first opening
// only waits for its data, not for the code too.
const loadTransactionModal = () => import("./TransactionModal");
const TransactionModal = lazy(loadTransactionModal);

/**
 * Renders TransactionModal only while `opened`, so each opening mounts a fresh form, and loads
 * its code in the background after the page renders. Props other than `opened` are passed through.
 * @param {{ opened: boolean, close: () => void, transactionId?: number | null,
 *   loadedRecentTransactions?: any[] | null, onSaved?: () => void }} props
 */
export default function LazyTransactionModal({ opened, ...props }) {
  useEffect(() => {
    loadTransactionModal().catch(() => {}); // ignored here: opening the dialog loads it again
  }, []);
  if (!opened) {
    return null;
  }
  return (
    <Suspense
      fallback={
        <Modal
          opened
          onClose={props.close}
          withCloseButton={false}
          centered
          title="Loading…"
        >
          <Center py="xl">
            <Loader aria-label="Loading the transaction form" />
          </Center>
        </Modal>
      }
    >
      <TransactionModal {...props} />
    </Suspense>
  );
}
