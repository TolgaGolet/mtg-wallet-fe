import { fetchById, isNotFound } from "./fetchById";

const callApiReturning = (content) => ({
  post: vi.fn().mockResolvedValue({ data: { content } }),
});

test("returns the first record of the page", async () => {
  const callApi = callApiReturning([{ id: 7, name: "Cash" }]);
  await expect(fetchById(callApi, "account", "7")).resolves.toEqual({
    id: 7,
    name: "Cash",
  });
  expect(callApi.post).toHaveBeenCalledWith(
    "account/search",
    { id: "7" },
    expect.objectContaining({ params: { pageNo: 0 } })
  );
});

// Regression: a deleted or foreign id resolved to {} and opened an empty edit form
test("an empty page is a not-found error", async () => {
  const error = await fetchById(callApiReturning([]), "payee", "9").catch(
    (e) => e
  );
  expect(isNotFound(error)).toBe(true);
});

test("other errors are passed through unchanged", async () => {
  const failure = new Error("Network Error");
  const callApi = { post: vi.fn().mockRejectedValue(failure) };
  const error = await fetchById(callApi, "payee", "9").catch((e) => e);
  expect(error).toBe(failure);
  expect(isNotFound(error)).toBe(false);
});
