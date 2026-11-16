import { renderHook, waitFor } from "@testing-library/react";
import useTransactionFormData from "./useTransactionFormData";
import { isNotFound } from "../../api/fetchById";
import { ok, page } from "../../test/renderWithProviders";

const mockApi = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("../../utils/useAxios", () => ({ default: () => mockApi }));

const CASH = { id: 1, name: "Cash", currency: { value: "TRY" } };
const BANK = { id: 2, name: "Bank", currency: { value: "TRY" } };
const FOOD = { id: 10, name: "Food" };
const ENUMS = { categoryList: [FOOD], accountList: [CASH, BANK] };
const RECENT = [{ id: 100 }, { id: 101 }];

/** Answers `transaction/search` with `byId` for an id lookup, otherwise with RECENT. */
const mockSearch = (byId = null) =>
  mockApi.post
    .mockReset()
    .mockImplementation((url, body) =>
      page(body.id ? (byId ? [byId] : []) : RECENT)
    );

beforeEach(() => {
  mockApi.get.mockReset().mockImplementation(() => ok(ENUMS));
  mockSearch();
});

const load = async (transactionId, loadedRecent) => {
  const onLoaded = vi.fn();
  const { result } = renderHook(() =>
    useTransactionFormData(transactionId, loadedRecent, onLoaded)
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  return { result, onLoaded };
};

test("create mode loads the enums and recent transactions, and no transaction", async () => {
  const { result, onLoaded } = await load(null);

  expect(result.current.data).toEqual({
    categoryList: [FOOD],
    accountList: [CASH, BANK],
    recentTransactions: RECENT,
    transaction: null,
  });
  expect(onLoaded).toHaveBeenCalledWith(result.current.data);
  expect(mockApi.post).toHaveBeenCalledTimes(1);
  expect(mockApi.post).toHaveBeenCalledWith(
    "transaction/search",
    {},
    expect.objectContaining({ params: { pageNo: 0 } })
  );
});

test("recent transactions the parent already loaded are reused instead of searched again", async () => {
  const loaded = [{ id: 7 }];
  const { result } = await load(undefined, loaded);

  expect(result.current.data.recentTransactions).toBe(loaded);
  expect(mockApi.post).not.toHaveBeenCalled();
});

test("an edited transaction's inactive category and accounts are added to the options", async () => {
  const oldCategory = { id: 11, name: "Old category" };
  const closedAccount = { id: 3, name: "Closed", currency: { value: "TRY" } };
  const savings = { id: 4, name: "Savings", currency: { value: "TRY" } };
  mockSearch({
    id: 5,
    payee: { category: oldCategory },
    sourceAccount: closedAccount,
    targetAccount: savings,
  });

  const { result } = await load(5, []);

  expect(result.current.data.categoryList).toEqual([FOOD, oldCategory]);
  expect(result.current.data.accountList).toEqual([
    CASH,
    BANK,
    closedAccount,
    savings,
  ]);
});

test("options the enums already offer are not duplicated", async () => {
  mockSearch({ id: 5, payee: { category: FOOD }, sourceAccount: CASH });

  const { result } = await load(5, []);

  expect(result.current.data.categoryList).toEqual([FOOD]);
  expect(result.current.data.accountList).toEqual([CASH, BANK]);
});

test("missing enum lists still yield the transaction's own options", async () => {
  mockApi.get.mockImplementation(() => ok({}));
  mockSearch({ id: 5, payee: { category: FOOD }, sourceAccount: CASH });

  const { result } = await load(5, []);

  expect(result.current.data.categoryList).toEqual([FOOD]);
  expect(result.current.data.accountList).toEqual([CASH]);
});

test("a transaction that doesn't exist is a not-found error and never fills the form", async () => {
  mockSearch();

  const { result, onLoaded } = await load(99, []);

  expect(isNotFound(result.current.error)).toBe(true);
  expect(onLoaded).not.toHaveBeenCalled();
});
