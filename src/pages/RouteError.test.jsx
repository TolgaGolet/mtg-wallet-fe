import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import RouteError from "./RouteError";
import { CHUNK_LOAD_ERROR } from "../utils/chunkLoadError";

/** Renders a route whose page throws `error`, so the router shows RouteError. */
function renderThrowing(error) {
  const Broken = () => {
    throw error;
  };
  const router = createMemoryRouter([
    { path: "/", element: <Broken />, errorElement: <RouteError /> },
  ]);
  render(
    <MantineProvider>
      <RouterProvider router={router} />
    </MantineProvider>
  );
}

const NEW_VERSION = "A new version is available";
const GENERIC = "Something went wrong";

beforeEach(() => {
  // React logs every error a route boundary catches
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// index.jsx marks every lazy load Vite reports as failed (see chunkLoadError.js)
test("a page that failed to load asks for a reload to get the new version", () => {
  renderThrowing(Object.assign(new TypeError("x"), { name: CHUNK_LOAD_ERROR }));

  expect(
    screen.getByRole("heading", { name: NEW_VERSION })
  ).toBeInTheDocument();
});

test("any other error shows the generic message", () => {
  renderThrowing(new TypeError("Cannot read properties of undefined"));

  expect(screen.getByRole("heading", { name: GENERIC })).toBeInTheDocument();
});

test("offers the home page as a plain link", () => {
  renderThrowing(new Error("boom"));

  expect(
    screen.getByRole("link", { name: "Go to the home page" })
  ).toHaveAttribute("href", "/");
});

test("Reload reloads the page", async () => {
  const reload = vi.fn();
  const original = window.location;
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...original, reload },
  });
  try {
    renderThrowing(new Error("boom"));

    await userEvent.click(screen.getByRole("button", { name: "Reload" }));

    expect(reload).toHaveBeenCalled();
  } finally {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: original,
    });
  }
});
