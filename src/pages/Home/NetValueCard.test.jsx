import { screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import NetValueCard from "./NetValueCard";
import { resetHomeCurrencySave } from "./homeCurrencySave";
import { ok, renderWithProviders } from "../../test/renderWithProviders";

const mockApi = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("../../utils/useAxios", () => ({ default: () => mockApi }));

const ENUMS = {
  currencies: [
    { value: "TRY", label: "Turkish Lira" },
    { value: "USD", label: "US Dollar" },
  ],
  selectedCurrency: null,
};
const GAIN = { netValue: 1500, profitLoss: 250.5, profitLossPercentage: 20 };

/** Answers home/enums and home/net-value with the given functions. */
const mockHome = ({
  enums = () => ok(ENUMS),
  netValue = () => ok(GAIN),
} = {}) =>
  mockApi.get
    .mockReset()
    .mockImplementation((url, config) =>
      url === "home/enums" ? enums() : netValue(config.params)
    );

const callsTo = (url) =>
  mockApi.get.mock.calls.filter(([calledUrl]) => calledUrl === url);
const netValueParams = () =>
  callsTo("home/net-value").map(([, config]) => config.params);

beforeEach(() => {
  resetHomeCurrencySave();
  mockHome();
});

const renderCard = (props = {}) =>
  renderWithProviders(<NetValueCard {...props} />, {
    auth: { user: { sub: "ada" } },
  });

const hideButton = () => screen.getByRole("button", { name: "Hide balances" });

test("shows the net value and a gain with its percentage in the selected currency", async () => {
  renderCard();

  expect(await screen.findByText("₺ 1,500.00")).toBeInTheDocument();
  expect(screen.getByText("₺ 250.50")).toBeInTheDocument();
  expect(screen.getByText(/\(20%\)/)).toBeInTheDocument();
  expect(netValueParams()).toEqual([
    { currencyValue: "TRY", intervalValue: "D" },
  ]);
});

test("a loss is shown with its minus sign", async () => {
  mockHome({
    netValue: () =>
      ok({ netValue: 900, profitLoss: -100, profitLossPercentage: -10 }),
  });
  renderCard();

  expect(await screen.findByText("-₺ 100.00")).toBeInTheDocument();
  expect(screen.getByText(/\(-10%\)/)).toBeInTheDocument();
});

test("without any net value it asks the user to add an account", async () => {
  mockHome({ netValue: () => ok(null) });
  renderCard();

  expect(
    await screen.findByText("Add an account to see your net value.")
  ).toBeInTheDocument();
});

test("hiding balances masks the amounts and is announced with aria-pressed", async () => {
  const { user } = renderCard();
  await screen.findByText("₺ 1,500.00");
  expect(hideButton()).toHaveAttribute("aria-pressed", "false");

  await user.click(hideButton());

  expect(hideButton()).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByText("******")).toBeInTheDocument();
  expect(screen.getByText("*** (**%)")).toBeInTheDocument();
  expect(screen.queryByText("₺ 1,500.00")).toBeNull();
});

test("hidden balances stay hidden on the next visit", async () => {
  const { user, unmount } = renderCard();
  await screen.findByText("₺ 1,500.00");
  await user.click(hideButton());
  unmount();

  renderCard();

  await waitFor(() => expect(screen.getByText("******")).toBeInTheDocument());
  expect(hideButton()).toHaveAttribute("aria-pressed", "true");
});

test("picking an interval reloads the net value for it and marks it pressed", async () => {
  const { user } = renderCard();
  await screen.findByText("₺ 1,500.00");

  await user.click(screen.getByRole("button", { name: "Monthly" }));

  await waitFor(() =>
    expect(netValueParams().at(-1)).toEqual({
      currencyValue: "TRY",
      intervalValue: "M",
    })
  );
  expect(screen.getByRole("button", { name: "Monthly" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  expect(screen.getByRole("button", { name: "Daily" })).toHaveAttribute(
    "aria-pressed",
    "false"
  );
});

test("a changed reloadKey loads the net value again (e.g. after a saved transaction)", async () => {
  function Parent() {
    const [reloadKey, setReloadKey] = useState(0);
    return (
      <>
        <button onClick={() => setReloadKey((key) => key + 1)}>Saved</button>
        <NetValueCard reloadKey={reloadKey} />
      </>
    );
  }
  const { user } = renderWithProviders(<Parent />, {
    auth: { user: { sub: "ada" } },
  });
  await screen.findByText("₺ 1,500.00");
  expect(callsTo("home/net-value")).toHaveLength(1);

  await user.click(screen.getByRole("button", { name: "Saved" }));

  await waitFor(() => expect(callsTo("home/net-value")).toHaveLength(2));
  expect(callsTo("home/enums")).toHaveLength(1);
});

test("a failed net value load retries only the net value", async () => {
  mockHome({
    netValue: vi
      .fn()
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockImplementation(() => ok(GAIN)),
  });
  const { user } = renderCard();

  await user.click(await screen.findByRole("button", { name: /retry/i }));

  expect(await screen.findByText("₺ 1,500.00")).toBeInTheDocument();
  expect(callsTo("home/enums")).toHaveLength(1);
});

test("a failed currency load retries the currencies, then loads the net value", async () => {
  mockHome({
    enums: vi
      .fn()
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockImplementation(() => ok(ENUMS)),
  });
  const { user } = renderCard();

  await user.click(await screen.findByRole("button", { name: /retry/i }));

  expect(await screen.findByText("₺ 1,500.00")).toBeInTheDocument();
  expect(callsTo("home/enums")).toHaveLength(2);
});
