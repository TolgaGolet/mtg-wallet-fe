import { StrictMode } from "react";
import { screen } from "@testing-library/react";
import VerifyEmail from "../pages/VerifyEmail";
import { resetTokenActionRequests } from "./TokenActionPage";
import { renderWithProviders } from "../test/renderWithProviders";
import { publicApi } from "../api/client";

beforeEach(() => {
  resetTokenActionRequests();
});

const renderVerify = () =>
  renderWithProviders(
    <StrictMode>
      <VerifyEmail />
    </StrictMode>,
    { route: "/verify-email/abc", path: "/verify-email/:token" }
  );

// The token is single-use: StrictMode's second effect run must not post it again
test("posts the token once, even when the effect runs twice", async () => {
  const post = vi.spyOn(publicApi, "post").mockResolvedValue({ data: {} });
  renderVerify();
  expect(
    await screen.findByText(/has been verified successfully/i)
  ).toBeInTheDocument();
  expect(post).toHaveBeenCalledTimes(1);
  expect(post).toHaveBeenCalledWith(
    "email-verification/verify/abc",
    {},
    { silentErrors: true }
  );
});

test("announces the server's error message", async () => {
  vi.spyOn(publicApi, "post").mockRejectedValue({
    response: { status: 400, data: "An error occurred: Token expired." },
  });
  renderVerify();
  expect(await screen.findByRole("status")).toHaveTextContent(
    "An error occurred: Token expired."
  );
  expect(screen.getByRole("link", { name: /go to login/i })).toHaveAttribute(
    "href",
    "/login"
  );
});

// Regression: a failed request stayed cached for the whole session, so coming back to the link
// showed the same failure without asking the server again
test("a network failure can be retried, and the retry posts again", async () => {
  const post = vi
    .spyOn(publicApi, "post")
    .mockRejectedValueOnce(new Error("Network Error"))
    .mockResolvedValue({ data: {} });
  const { user } = renderVerify();

  await user.click(await screen.findByRole("button", { name: "Retry" }));

  expect(
    await screen.findByText(/has been verified successfully/i)
  ).toBeInTheDocument();
  expect(post).toHaveBeenCalledTimes(2);
});

test("a rejected token offers no retry", async () => {
  vi.spyOn(publicApi, "post").mockRejectedValue({
    response: { status: 400, data: "An error occurred: Token expired." },
  });
  renderVerify();
  await screen.findByText("An error occurred: Token expired.");
  expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
});
