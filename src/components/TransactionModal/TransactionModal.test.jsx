import { screen, waitFor, within } from "@testing-library/react";
import TransactionModal from "./TransactionModal";
import showNotification from "../showNotification";
import {
  ok,
  page,
  pickOption,
  renderWithProviders,
} from "../../test/renderWithProviders";

const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("../../utils/useAxios", () => ({ default: () => mockApi }));
vi.mock("../showNotification", () => ({ default: vi.fn() }));

const ACCOUNTS = [
  { id: 1, name: "Cash", balance: 100, currency: { value: "TRY" } },
  { id: 2, name: "Bank", balance: 50, currency: { value: "TRY" } },
  { id: 3, name: "Dollars", balance: 5, currency: { value: "USD" } },
];
const CATEGORIES = [
  { id: 10, name: "Groceries", transactionType: { value: "EXP" } },
  { id: 20, name: "Salary", transactionType: { value: "INC" } },
];
const TRANSACTION = {
  id: 5,
  type: { value: "EXP" },
  amount: 12.5,
  dateTime: "2026-11-01T10:00:00",
  notes: "milk",
  payee: { id: 7, name: "Market", category: { id: 10, name: "Groceries" } },
  sourceAccount: ACCOUNTS[0],
  targetAccount: null,
};

beforeEach(() => {
  mockApi.get
    .mockReset()
    .mockImplementation(() =>
      ok({ accountList: ACCOUNTS, categoryList: CATEGORIES })
    );
  mockApi.post.mockReset().mockImplementation((url, body) => {
    if (url === "transaction/search") {
      return page(body?.id ? [TRANSACTION] : []);
    }
    return page([]); // payee/search
  });
  mockApi.put.mockReset().mockImplementation(() => ok({}));
  mockApi.delete.mockReset().mockImplementation(() => ok({}));
  vi.mocked(showNotification).mockReset();
});

const renderModal = (props = {}) => {
  const close = vi.fn();
  const onSaved = vi.fn();
  const view = renderWithProviders(
    <TransactionModal
      close={close}
      onSaved={onSaved}
      transactionId={null}
      {...props}
    />
  );
  return { ...view, close, onSaved };
};

const field = (name) => screen.getByRole("textbox", { name });

test("edit mode fills the form from the loaded transaction", async () => {
  renderModal({ transactionId: 5 });
  await waitFor(() => expect(field("Payee")).toHaveValue("Market"));
  expect(field("Category")).toHaveValue("Groceries");
  expect(field("Account")).toHaveValue("Cash (100.00 TRY)");
  expect(field("Amount")).toHaveValue("12.50");
  expect(field("Notes")).toHaveValue("milk");
});

// The enums list only ACTIVE categories and accounts; the transaction's own ones come with it
test("edit mode shows the transaction's inactive category and account", async () => {
  const oldAccount = {
    id: 9,
    name: "Old",
    balance: 0,
    currency: { value: "TRY" },
  };
  mockApi.post.mockImplementation((url, body) =>
    url === "transaction/search" && body?.id
      ? page([
          {
            ...TRANSACTION,
            payee: {
              id: 7,
              name: "Market",
              category: {
                id: 99,
                name: "Retired",
                transactionType: { value: "EXP" },
              },
            },
            sourceAccount: oldAccount,
          },
        ])
      : page([])
  );
  renderModal({ transactionId: 5 });

  await waitFor(() => expect(field("Category")).toHaveValue("Retired"));
  expect(field("Account")).toHaveValue("Old (0.00 TRY)");
  expect(mockApi.post).not.toHaveBeenCalledWith(
    "category/search",
    expect.anything(),
    expect.anything()
  );
});

// Payees and categories belong to one transaction type
test("switching the type clears the payee and the category", async () => {
  const { user } = renderModal({ transactionId: 5 });
  await waitFor(() => expect(field("Payee")).toHaveValue("Market"));

  await user.click(screen.getByText("Income"));

  expect(field("Payee")).toHaveValue("");
  expect(field("Category")).toHaveValue("");
});

test("a transfer only offers other accounts with the source's currency", async () => {
  const { user } = renderModal();
  await waitFor(() => expect(field("Account")).toBeEnabled());
  await user.click(screen.getByText("Transfer"));
  await pickOption(user, "Account", "Cash (100.00 TRY)");

  await user.click(field("Target Account"));
  expect(
    await screen.findByRole("option", { name: "Bank (50.00 TRY)" })
  ).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: /Dollars/ })).toBeNull();
  expect(screen.queryByRole("option", { name: /^Cash/ })).toBeNull();
});

// Each pick moves focus to the next field 50 ms later; wait for that move, so it can't land in the
// middle of the next step (this test was flaky under full-suite load)
test("changing the source to another currency clears the chosen target", async () => {
  const { user } = renderModal();
  await waitFor(() => expect(field("Payee")).toHaveFocus());
  await user.click(screen.getByText("Transfer"));
  await waitFor(() => expect(field("Payee")).toHaveFocus());
  await pickOption(user, "Account", "Cash (100.00 TRY)");
  await waitFor(() => expect(field("Target Account")).toHaveFocus());
  await pickOption(user, "Target Account", "Bank (50.00 TRY)");
  await waitFor(() => expect(field("Amount")).toHaveFocus());
  expect(field("Target Account")).toHaveValue("Bank (50.00 TRY)");

  // A searchable Select filters its options by the text in it
  await user.clear(field("Account"));
  await pickOption(user, "Account", "Dollars (5.00 USD)");

  await waitFor(() => expect(field("Target Account")).toHaveValue(""));
});

test("closing with unsaved changes asks for confirmation", async () => {
  const { user, close } = renderModal();
  // The dialog focuses Payee 50 ms after loading; let that happen so it can't take over the typing
  await waitFor(() => expect(field("Payee")).toHaveFocus());
  await new Promise((resolve) => setTimeout(resolve, 100));
  await user.type(field("Notes"), "coffee");
  expect(field("Notes")).toHaveValue("coffee");

  await user.click(screen.getByRole("button", { name: "Cancel" }));

  expect(await screen.findByText("Unsaved Changes")).toBeInTheDocument();
  expect(close).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Yes" }));
  expect(close).toHaveBeenCalledTimes(1);
});

test("closing an untouched form needs no confirmation", async () => {
  const { user, close } = renderModal();
  await waitFor(() => expect(field("Notes")).toBeEnabled());
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(close).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("Unsaved Changes")).toBeNull();
});

// F3/F7: the dialog loads the transaction with fetchById, so a deleted one is "not found"
test("a deleted transaction shows 'not found'", async () => {
  mockApi.post.mockImplementation(() => page([]));
  renderModal({ transactionId: 99 });
  expect(await screen.findByText("Transaction not found")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
});

describe("saving", () => {
  /** The request every save of the unchanged TRANSACTION sends. */
  const EDIT_REQUEST = {
    typeValue: "EXP",
    payeeId: 7,
    payeeName: "Market",
    categoryId: 10,
    amount: 12.5,
    dateTime: new Date("2026-11-01T10:00:00"),
    sourceAccountId: 1,
    targetAccountId: null,
    notes: "milk",
  };

  const loadEdit = async (props = {}) => {
    const view = renderModal({ transactionId: 5, ...props });
    await waitFor(() => expect(field("Payee")).toHaveValue("Market"));
    return view;
  };

  test("an edit sends the whole request to update, then closes and tells the parent", async () => {
    const { user, close, onSaved } = await loadEdit();

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(mockApi.put).toHaveBeenCalledWith(
      "transaction/update/5",
      EDIT_REQUEST
    );
    expect(close).toHaveBeenCalledTimes(1);
    expect(showNotification).toHaveBeenCalledWith(
      "Transaction saved",
      "success"
    );
  });

  test("a cleared note is sent as null, which the backend accepts", async () => {
    const { user, onSaved } = await loadEdit();

    await user.clear(field("Notes"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mockApi.put).toHaveBeenCalledWith(
      "transaction/update/5",
      expect.objectContaining({ notes: null })
    );
  });

  test("an amount below 0.01 is reported and nothing is sent", async () => {
    const { user } = await loadEdit();

    await user.clear(field("Amount"));
    await user.type(field("Amount"), "0");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Amount must be greater than 0.01")
    ).toBeInTheDocument();
    expect(mockApi.put).not.toHaveBeenCalled();
  });

  test("a rejected save keeps the dialog open with the form usable", async () => {
    mockApi.put.mockImplementation(() =>
      Promise.reject({ response: { status: 409 } })
    );
    const { user, close, onSaved } = await loadEdit();

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save" })).toBeEnabled()
    );
    expect(close).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
    expect(showNotification).not.toHaveBeenCalled();
    expect(field("Notes")).toHaveValue("milk");
  });

  test("an edited transfer sends its target account", async () => {
    const transfer = {
      ...TRANSACTION,
      type: { value: "TRA" },
      payee: { id: 8, name: "Me", category: { id: 30, name: "Moving money" } },
      targetAccount: ACCOUNTS[1],
    };
    mockApi.get.mockImplementation(() =>
      ok({
        accountList: ACCOUNTS,
        categoryList: [
          ...CATEGORIES,
          { id: 30, name: "Moving money", transactionType: { value: "TRA" } },
        ],
      })
    );
    mockApi.post.mockImplementation((url, body) =>
      url === "transaction/search" && body?.id ? page([transfer]) : page([])
    );
    const { user, onSaved } = renderModal({ transactionId: 5 });
    await waitFor(() =>
      expect(field("Target Account")).toHaveValue("Bank (50.00 TRY)")
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mockApi.put).toHaveBeenCalledWith(
      "transaction/update/5",
      expect.objectContaining({
        typeValue: "TRA",
        sourceAccountId: 1,
        targetAccountId: 2,
      })
    );
  });

  test("delete runs only after confirming, then closes and tells the parent", async () => {
    const { user, close, onSaved } = await loadEdit();

    await user.click(
      screen.getByRole("button", { name: "Delete this transaction" })
    );
    expect(
      await screen.findByText(/This action will revert this transaction/)
    ).toBeInTheDocument();
    expect(mockApi.delete).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(mockApi.delete).toHaveBeenCalledWith("transaction/delete/5");
    expect(close).toHaveBeenCalledTimes(1);
    expect(showNotification).toHaveBeenCalledWith(
      "Transaction deleted",
      "success"
    );
  });

  test("cancelling the delete confirmation deletes nothing", async () => {
    const { user, close } = await loadEdit();

    await user.click(
      screen.getByRole("button", { name: "Delete this transaction" })
    );
    const confirmDialog = await screen.findByText(
      /This action will revert this transaction/
    );
    await user.click(
      within(confirmDialog.closest("section")).getByRole("button", {
        name: "Cancel",
      })
    );

    expect(mockApi.delete).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });

  // A picked suggestion puts the payee's name in the search box; the exact match locks its category
  test("a suggested payee and account fill the form, and create sends them", async () => {
    const { user, close, onSaved } = renderModal({
      loadedRecentTransactions: [TRANSACTION],
    });
    await waitFor(() => expect(field("Payee")).toHaveFocus());

    await user.click(screen.getByRole("button", { name: "Use payee Market" }));
    await waitFor(() => expect(field("Category")).toHaveValue("Groceries"), {
      timeout: 2000,
    });
    expect(field("Category")).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Use account Cash" }));
    await waitFor(() => expect(field("Amount")).toHaveFocus());
    await user.type(field("Amount"), "20");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(mockApi.post).toHaveBeenCalledWith("transaction/create", {
      ...EDIT_REQUEST,
      amount: 20,
      dateTime: expect.any(Date),
      notes: null,
    });
    expect(close).toHaveBeenCalledTimes(1);
    expect(showNotification).toHaveBeenCalledWith(
      "Transaction created",
      "success"
    );
  });

  // The backend's TransactionWriteRequest.NEW_PAYEE_ID (-1) means "create a payee from payeeName"
  test("a new payee is sent as id -1 with its name, without the (New) suffix", async () => {
    const { user, onSaved } = renderModal();
    await waitFor(() => expect(field("Payee")).toHaveFocus());

    await user.type(field("Payee"), "Bakery");
    await user.click(
      await screen.findByRole(
        "option",
        { name: "Bakery (New)" },
        { timeout: 2000 }
      )
    );
    await waitFor(() => expect(field("Category")).toHaveFocus());
    await pickOption(user, "Category", "Groceries");
    await waitFor(() => expect(field("Account")).toHaveFocus());
    await pickOption(user, "Account", "Cash (100.00 TRY)");
    await waitFor(() => expect(field("Amount")).toHaveFocus());
    await user.type(field("Amount"), "3");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mockApi.post).toHaveBeenCalledWith(
      "transaction/create",
      expect.objectContaining({
        payeeId: -1,
        payeeName: "Bakery",
        categoryId: 10,
        amount: 3,
        sourceAccountId: 1,
      })
    );
  });

  test("All fills in the selected account's whole balance", async () => {
    // The suggestion badge picks the account without a dropdown, which a late re-render can close
    const { user } = renderModal({ loadedRecentTransactions: [TRANSACTION] });
    await waitFor(() => expect(field("Payee")).toHaveFocus());
    await user.click(screen.getByRole("button", { name: "Use account Cash" }));
    await waitFor(() => expect(field("Amount")).toHaveFocus());

    await user.click(
      screen.getByRole("button", { name: "Use the whole account balance" })
    );

    expect(field("Amount")).toHaveValue("100.00");
  });
});
