import * as matchers from "@testing-library/jest-dom/matchers";
import { expect as importedExpect } from "vitest";

// With `globals: true`, Vitest 5's global `expect` is not the one exported by "vitest", so the
// jest-dom matchers are registered on both
importedExpect.extend(matchers);
expect.extend(matchers);

// Browser APIs Mantine uses that jsdom doesn't implement
const { getComputedStyle } = window;
window.getComputedStyle = (element) => getComputedStyle(element);
window.HTMLElement.prototype.scrollIntoView = () => {};
window.matchMedia ??= (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});
window.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Testing Library unmounts rendered components itself after each test (globals: true)
afterEach(() => {
  localStorage.clear();
});
