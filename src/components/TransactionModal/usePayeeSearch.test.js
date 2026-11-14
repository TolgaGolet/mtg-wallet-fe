import { act, renderHook, waitFor } from "@testing-library/react";
import usePayeeSearch, { withNewPayeeOption } from "./usePayeeSearch";
import { NEW_PAYEE_OPTION_ID } from "./transactionRequest";

const mockPost = jest.fn();
jest.mock("../../utils/useAxios", () => () => ({ post: mockPost }));

const PAYEES = {
  EXP: [{ id: 1, name: "Market", categoryId: 10 }],
  INC: [{ id: 2, name: "Market", categoryId: 20 }],
};

beforeEach(() => {
  mockPost.mockReset();
  mockPost.mockImplementation((url, request) =>
    Promise.resolve({
      data: {
        content: (PAYEES[request.transactionTypeValue] ?? []).filter(
          (p) => !request.name || p.name === request.name
        ),
      },
    })
  );
});

describe("withNewPayeeOption", () => {
  // Regression: "Ab (New)" was offered and the backend's payeeName @Size(min = 3) answered 400
  test("only offers names the backend accepts as payeeName", () => {
    const empty = { content: [] };
    expect(withNewPayeeOption({ name: "Ab" }, empty)).toEqual([]);
    expect(withNewPayeeOption({ name: "Bakery" }, empty)).toEqual([
      { id: NEW_PAYEE_OPTION_ID, name: "Bakery (New)" },
    ]);
  });

  test("no option when the name already exists", () => {
    expect(
      withNewPayeeOption({ name: "market" }, { content: PAYEES.EXP })
    ).toEqual(PAYEES.EXP);
  });
});

function renderSearch(initialType = "EXP", enabled = true) {
  const onKeywordChange = jest.fn();
  const view = renderHook(
    ({ type, enabled }) => usePayeeSearch(type, { enabled, onKeywordChange }),
    { initialProps: { type: initialType, enabled } }
  );
  return { ...view, onKeywordChange };
}

describe("usePayeeSearch", () => {
  // Regression: after a type change the exact match was taken from the old type's list
  test("a type change searches the new type before matching the keyword", async () => {
    const { result, rerender, onKeywordChange } = renderSearch("EXP");
    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));
    // Matches the EXP payee already in the list (the keyword is debounced by 500ms)
    act(() => result.current.setKeyword("Market"));
    await waitFor(
      () =>
        expect(onKeywordChange).toHaveBeenLastCalledWith(
          "Market",
          PAYEES.EXP[0]
        ),
      { timeout: 1500 }
    );

    mockPost.mockClear();
    rerender({ type: "INC", enabled: true });

    await waitFor(() =>
      expect(onKeywordChange).toHaveBeenLastCalledWith("Market", PAYEES.INC[0])
    );
    expect(mockPost).toHaveBeenCalledWith(
      "payee/search",
      { transactionTypeValue: "INC", name: "Market" },
      expect.anything()
    );
    expect(result.current.payeeList).toEqual(PAYEES.INC);
  });

  // Regression: the cache outlived the modal, so a payee created by the last save showed as "(New)"
  test("reopening the modal searches again instead of reusing cached results", async () => {
    const { rerender } = renderSearch("EXP");
    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));

    rerender({ type: "EXP", enabled: false });
    rerender({ type: "EXP", enabled: true });

    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(2));
  });
});
