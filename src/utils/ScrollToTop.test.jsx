import { screen } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";
import { renderWithProviders } from "../test/renderWithProviders";

function Nav() {
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate("/accounts")}>Other page</button>
      <button onClick={() => navigate("/transactions?page=2")}>
        Next page
      </button>
    </>
  );
}

const renderAt = (route) =>
  renderWithProviders(
    <>
      <ScrollToTop />
      <Nav />
    </>,
    { route }
  );

let scrollTo;
beforeEach(() => {
  scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => {
  scrollTo.mockRestore();
});

test("scrolls to the top when the path changes", async () => {
  const { user } = renderAt("/transactions");
  scrollTo.mockClear(); // the first render scrolls too

  await user.click(screen.getByRole("button", { name: "Other page" }));

  expect(scrollTo).toHaveBeenCalledWith(0, 0);
});

test("keeps the position when only the page or filter in the query changes", async () => {
  const { user } = renderAt("/transactions");
  scrollTo.mockClear();

  await user.click(screen.getByRole("button", { name: "Next page" }));

  expect(scrollTo).not.toHaveBeenCalled();
});
