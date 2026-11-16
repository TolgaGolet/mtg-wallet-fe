import { screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import LazyTransactionModal from "./LazyTransactionModal";
import { renderWithProviders } from "../../test/renderWithProviders";

// The real dialog loads data and @mantine/dates; a stub shows what it was given and counts mounts.
// Its module stays pending until `chunk.release()`, like a chunk still downloading.
const chunk = vi.hoisted(() => {
  let release;
  const loaded = new Promise((resolve) => {
    release = resolve;
  });
  return { loaded, release: () => release(), mounts: 0 };
});
vi.mock("./TransactionModal", async () => {
  await chunk.loaded;
  const { useEffect } = await import("react");
  return {
    default: function StubTransactionModal({ transactionId, close }) {
      useEffect(() => {
        chunk.mounts += 1;
      }, []);
      return (
        <div role="dialog" aria-label="Transaction">
          <span>Editing {transactionId ?? "new"}</span>
          <button onClick={close}>Close</button>
        </div>
      );
    },
  };
});

function Harness({ transactionId = 7 }) {
  const [opened, setOpened] = useState(false);
  return (
    <>
      <button onClick={() => setOpened(true)}>Open</button>
      <LazyTransactionModal
        opened={opened}
        close={() => setOpened(false)}
        transactionId={transactionId}
      />
    </>
  );
}

test("while the dialog's code is still downloading, a closable loading dialog is shown", async () => {
  const { user } = renderWithProviders(<Harness />);

  await user.click(screen.getByRole("button", { name: "Open" }));
  expect(
    await screen.findByLabelText("Loading the transaction form")
  ).toBeInTheDocument();

  await user.keyboard("{Escape}"); // the fallback's onClose is the page's close
  await waitFor(() =>
    expect(screen.queryByLabelText("Loading the transaction form")).toBeNull()
  );

  chunk.release();
});

test("renders nothing while closed", () => {
  renderWithProviders(<Harness />);

  expect(screen.queryByRole("dialog")).toBeNull();
});

test("opened, it renders the dialog with the given props", async () => {
  chunk.release();
  const { user } = renderWithProviders(<Harness transactionId={42} />);

  await user.click(screen.getByRole("button", { name: "Open" }));

  expect(await screen.findByText("Editing 42")).toBeInTheDocument();
});

test("every opening mounts a fresh dialog", async () => {
  chunk.release();
  const { user } = renderWithProviders(<Harness />);
  const before = chunk.mounts;

  await user.click(screen.getByRole("button", { name: "Open" }));
  await user.click(await screen.findByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog", { name: "Transaction" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Open" }));
  await screen.findByRole("dialog", { name: "Transaction" });

  expect(chunk.mounts - before).toBe(2);
});
