import { screen, waitFor } from "@testing-library/react";
import Home from "./Home";
import { resetHomeCurrencySave } from "./homeCurrencySave";
import { notifySessionChange } from "../../api/client";
import showNotification from "../../components/showNotification";
import {
  ok,
  page,
  pickOption,
  renderWithProviders,
} from "../../test/renderWithProviders";

const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));
vi.mock("../../utils/useAxios", () => ({ default: () => mockApi }));
vi.mock("../../components/showNotification", () => ({ default: vi.fn() }));

const CURRENCIES = [
  { value: "TRY", label: "Turkish Lira" },
  { value: "USD", label: "US Dollar" },
  { value: "EUR", label: "Euro" },
];
const NET_VALUE = { netValue: 100, profitLoss: 0, profitLossPercentage: 0 };
const serverError = () => Promise.reject({ response: { status: 500 } });
const badRequest = () =>
  Promise.reject({
    response: { status: 400, data: "An error occurred: Invalid request." },
  });

const mockEnums = (selectedCurrency) => {
  mockApi.get
    .mockReset()
    .mockImplementation((url) =>
      url === "home/enums"
        ? ok({ currencies: CURRENCIES, selectedCurrency })
        : ok(NET_VALUE)
    );
};

/** Answers home/currency with `answer(body)`; everything else as usual. */
const mockCurrencySave = (answer) => {
  mockApi.post.mockReset().mockImplementation((url, body) => {
    if (url === "transaction/search") return page([]);
    return url === "home/currency" ? answer(body) : ok(null);
  });
};

/** home/currency calls stay pending until settled, oldest first. */
const holdCurrencySaves = () => {
  const pending = [];
  mockCurrencySave(
    () => new Promise((resolve, reject) => pending.push({ resolve, reject }))
  );
  return {
    finishNext: () => pending.shift().resolve({ data: null }),
    failNext: (error) => pending.shift().reject(error),
  };
};

beforeEach(() => {
  resetHomeCurrencySave();
  vi.mocked(showNotification).mockReset();
  mockEnums(null);
  mockCurrencySave(() => ok(null));
});

const renderHome = () =>
  renderWithProviders(<Home />, { auth: { user: { sub: "ada" } } });

const currencyInput = () => screen.getByRole("textbox", { name: "Currency" });
const savingStatus = () => screen.getByRole("status");
const waitUntilLoaded = () =>
  waitFor(() => expect(currencyInput()).toBeEnabled());
const waitUntilSaved = () =>
  waitFor(() => expect(savingStatus()).toBeEmptyDOMElement());

const callsTo = (mock, url) =>
  mock.mock.calls
    .filter(([calledUrl]) => calledUrl === url)
    .map(([, arg]) => arg);
const netValueCurrencies = () =>
  callsTo(mockApi.get, "home/net-value").map(
    (config) => config.params.currencyValue
  );
const saveBodies = () => callsTo(mockApi.post, "home/currency");
const currencySaves = () => saveBodies().map((body) => body.currencyValue);

test("the currency saved on the account is preselected", async () => {
  mockEnums({ value: "USD", label: "US Dollar" });
  renderHome();

  await waitFor(() => expect(currencyInput()).toHaveValue("USD"));
  expect(netValueCurrencies()).toEqual(["USD"]);
});

test("without a saved currency the first offered one is used", async () => {
  renderHome();

  await waitFor(() => expect(currencyInput()).toHaveValue("TRY"));
});

test("picking a currency saves it under this user's session, ordered for the backend", async () => {
  const saves = holdCurrencySaves();
  const { user } = renderHome();
  await waitUntilLoaded();

  await pickOption(user, "Currency", "EUR");

  await waitFor(() =>
    expect(mockApi.post).toHaveBeenCalledWith(
      "home/currency",
      {
        currencyValue: "EUR",
        clientId: expect.any(String),
        sequence: expect.any(Number),
      },
      { silentErrors: true, sessionUser: "ada" }
    )
  );
  expect(savingStatus()).toHaveTextContent("Saving currency");
  await waitFor(() => expect(netValueCurrencies()).toContain("EUR"));

  saves.finishNext();
  await waitUntilSaved();
  expect(showNotification).not.toHaveBeenCalled();
});

test("a save failing on the server is tried again once, then the user is told", async () => {
  mockCurrencySave(serverError);
  const { user } = renderHome();
  await waitUntilLoaded();

  await pickOption(user, "Currency", "EUR");

  await waitFor(() => expect(currencySaves()).toEqual(["EUR", "EUR"]));
  await waitUntilSaved();
  expect(showNotification).toHaveBeenCalledTimes(1);
  expect(showNotification).toHaveBeenCalledWith(
    "Couldn't save the currency. Please try again.",
    "error"
  );
  expect(currencyInput()).toHaveValue("EUR");
});

test("a rejected save (4xx) is not retried, and the server's message is shown", async () => {
  mockCurrencySave(badRequest);
  const { user } = renderHome();
  await waitUntilLoaded();

  await pickOption(user, "Currency", "EUR");

  await waitUntilSaved();
  expect(currencySaves()).toEqual(["EUR"]);
  expect(showNotification).toHaveBeenCalledWith(
    "An error occurred: Invalid request.",
    "error"
  );
});

// Regression: the failure count carried over, so a pick made during a failing retry was never sent
test("a pick made while a failed save is being retried is still sent", async () => {
  const saves = holdCurrencySaves();
  const { user } = renderHome();
  await waitUntilLoaded();
  await pickOption(user, "Currency", "EUR");
  await waitFor(() => expect(currencySaves()).toEqual(["EUR"]));
  saves.failNext({ response: { status: 500 } });
  await waitFor(() => expect(currencySaves()).toEqual(["EUR", "EUR"]));

  await pickOption(user, "Currency", "USD");
  await waitFor(() => expect(currencySaves()).toEqual(["EUR", "EUR", "USD"]));
  saves.failNext({ response: { status: 500 } }); // the EUR retry: replaced, so nothing to report
  saves.finishNext();

  await waitUntilSaved();
  expect(showNotification).not.toHaveBeenCalled();
  expect(currencyInput()).toHaveValue("USD");
});

test("quick switches are each sent at once, with a rising sequence", async () => {
  holdCurrencySaves();
  const { user } = renderHome();
  await waitUntilLoaded();

  await pickOption(user, "Currency", "USD");
  await pickOption(user, "Currency", "EUR");
  await pickOption(user, "Currency", "TRY");

  await waitFor(() => expect(currencySaves()).toEqual(["USD", "EUR", "TRY"]));
  const [first, second, third] = saveBodies().map((body) => body.sequence);
  expect(first).toBeLessThan(second);
  expect(second).toBeLessThan(third);
  expect(new Set(saveBodies().map((body) => body.clientId)).size).toBe(1);
});

test("coming back to Home before the save finished keeps the pick; after it, the backend's value counts", async () => {
  const saves = holdCurrencySaves();
  const first = renderHome();
  await waitUntilLoaded();
  await pickOption(first.user, "Currency", "EUR");
  first.unmount();

  // The backend still answers with the old saved currency
  mockEnums({ value: "USD", label: "US Dollar" });
  const second = renderHome();
  await waitUntilLoaded();
  expect(currencyInput()).toHaveValue("EUR");

  saves.finishNext();
  await waitUntilSaved();
  second.unmount();
  // e.g. changed to TRY in another tab meanwhile
  mockEnums({ value: "TRY", label: "Turkish Lira" });
  renderHome();

  await waitUntilLoaded();
  expect(currencyInput()).toHaveValue("TRY");
});

// Regression: a pick that was never saved kept showing after logging out and back in
test("logging out drops a pick still waiting to be saved", async () => {
  const saves = holdCurrencySaves();
  const { user, unmount } = renderHome();
  await waitUntilLoaded();
  await pickOption(user, "Currency", "EUR");
  unmount();

  notifySessionChange(); // what AuthContext does on logout
  mockEnums({ value: "USD", label: "US Dollar" });
  renderHome();

  await waitUntilLoaded();
  expect(currencyInput()).toHaveValue("USD");
  expect(savingStatus()).toBeEmptyDOMElement();
  saves.failNext({ code: "ERR_CANCELED" });
  await waitFor(() => expect(showNotification).not.toHaveBeenCalled());
});
