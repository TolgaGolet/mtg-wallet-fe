import { renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import usePagedSearch from "./usePagedSearch";
import { page } from "../test/renderWithProviders";

const mockApi = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("./useAxios", () => ({ default: () => mockApi }));

const atRoute = (route) =>
  function Wrapper({ children }) {
    return <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>;
  };

beforeEach(() => {
  mockApi.post.mockReset();
  mockApi.post.mockImplementation(() => page([{ id: 1 }], { totalPages: 3 }));
});

// Regression: the filter was state but the page reset a later URL navigation, so a new filter on
// page 2 first fetched (new filter, page 2), then (new filter, page 1)
test("a new body on a later page fetches the first page once", async () => {
  const { result, rerender } = renderHook(
    ({ body }) => usePagedSearch("transaction/search", body),
    { wrapper: atRoute("/transactions?page=2"), initialProps: { body: {} } }
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(mockApi.post).toHaveBeenCalledTimes(1);
  expect(mockApi.post.mock.calls[0][2].params).toEqual({ pageNo: 1 });

  rerender({ body: { notes: "rent" } });

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.pageNo).toBe(0);
  expect(
    mockApi.post.mock.calls
      .slice(1)
      .map(([, body, config]) => [body, config.params])
  ).toEqual([[{ notes: "rent" }, { pageNo: 0 }]]);
});

test("the same body with new identity keeps the page from the URL", async () => {
  const { result, rerender } = renderHook(
    ({ body }) => usePagedSearch("transaction/search", body),
    {
      wrapper: atRoute("/transactions?page=2"),
      initialProps: { body: { a: 1 } },
    }
  );
  await waitFor(() => expect(result.current.loading).toBe(false));

  rerender({ body: { a: 1 } });

  expect(result.current.pageNo).toBe(1);
  expect(mockApi.post).toHaveBeenCalledTimes(1);
});
